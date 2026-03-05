/**
 * Child Controller (Refactored)
 * Handles HTTP requests and delegates business logic to services
 */
import childService from '../services/child.service.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import PDFDocument from 'pdfkit';
import geminiService from '../services/gemini.service.js';
import childQuizService from '../services/childQuiz.service.js';
import recommendationService from '../services/recommendation.service.js';

// @desc    Add a new child
// @route   POST /api/children
// @access  Private (Caregiver)
export const addChild = asyncHandler(async (req, res) => {
  const child = await childService.addChild(req.user._id, req.body);

  // Fire-and-forget: generate personalized Gemini quiz for this child
  console.log(`[ChildQuiz] Auto-generating quiz for new child "${child.name}" (${child._id})...`);
  childQuizService.generateAndSave(child._id, null).then(() => {
    console.log(`[ChildQuiz] ✅ Quiz generated for "${child.name}"`);
  }).catch(err => {
    console.error(`[ChildQuiz] ❌ Auto-generation failed for "${child.name}":`, err.message);
  });

  res.status(201).json({
    success: true,
    message: 'Child added successfully',
    data: child
  });
});

// @desc    Get all children for a caregiver
// @route   GET /api/children
// @access  Private (Caregiver)
export const getChildren = asyncHandler(async (req, res) => {
  const children = await childService.getChildrenByCaregiver(req.user._id);

  res.status(200).json({
    success: true,
    data: children,
    count: children.length
  });
});

// @desc    Get all children (for experts and admins)
// @route   GET /api/children/all
// @access  Private (Expert, Admin)
export const getAllChildren = asyncHandler(async (req, res) => {
  // Check authorization
  if (req.user.role !== 'expert' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only experts and admins can access all children.'
    });
  }

  const children = await childService.getAllChildren();

  res.status(200).json({
    success: true,
    data: children,
    count: children.length
  });
});

// @desc    Get a single child by ID
// @route   GET /api/children/:id
// @access  Private
export const getChild = asyncHandler(async (req, res) => {
  const isExpertOrAdmin = req.user.role === 'expert' || req.user.role === 'admin';
  const caregiverId = isExpertOrAdmin ? null : req.user._id;

  const child = await childService.getChildById(req.params.id, caregiverId);

  res.status(200).json({
    success: true,
    data: child
  });
});

// @desc    Update a child
// @route   PUT /api/children/:id
// @access  Private (Caregiver)
export const updateChild = asyncHandler(async (req, res) => {
  const child = await childService.updateChild(req.params.id, req.user._id, req.body);

  // Fire-and-forget: regenerate quiz so it reflects updated profile
  console.log(`[ChildQuiz] Profile updated for "${child.name}" — regenerating quiz...`);
  childQuizService.generateAndSave(child._id, null).then(() => {
    console.log(`[ChildQuiz] ✅ Quiz regenerated for "${child.name}"`);
  }).catch(err => {
    console.error(`[ChildQuiz] ❌ Regeneration failed for "${child.name}":`, err.message);
  });

  res.status(200).json({
    success: true,
    message: 'Child updated successfully',
    data: child
  });
});

// @desc    Delete a child
// @route   DELETE /api/children/:id
// @access  Private (Caregiver)
export const deleteChild = asyncHandler(async (req, res) => {
  const result = await childService.deleteChild(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    message: result.message
  });
});

// @desc    Get child statistics
// @route   GET /api/children/:id/stats
// @access  Private
export const getChildStats = asyncHandler(async (req, res) => {
  const isExpertOrAdmin = req.user.role === 'expert' || req.user.role === 'admin';
  const caregiverId = isExpertOrAdmin ? null : req.user._id;

  // Get child data and verify access
  const child = await childService.getChildById(req.params.id, caregiverId);
  const stats = await childService.getChildStatistics(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      child,
      ...stats
    }
  });
});

// @desc    Get child activities
// @route   GET /api/children/:id/activities
// @access  Private
export const getChildActivities = asyncHandler(async (req, res) => {
  const { type, limit } = req.query;
  const isExpertOrAdmin = req.user.role === 'expert' || req.user.role === 'admin';
  const caregiverId = isExpertOrAdmin ? null : req.user._id;

  // Verify access to child
  await childService.getChildById(req.params.id, caregiverId);

  const activities = await childService.getChildActivities(
    req.params.id,
    type || null,
    limit ? parseInt(limit) : null
  );

  res.status(200).json({
    success: true,
    data: activities,
    count: activities.length
  });
});

// @desc    Add activity for a child
// @route   POST /api/children/:id/activities
// @access  Private
export const addActivity = asyncHandler(async (req, res) => {
  const isExpertOrAdmin = req.user.role === 'expert' || req.user.role === 'admin';
  const caregiverId = isExpertOrAdmin ? null : req.user._id;

  // Verify access to child
  const child = await childService.getChildById(req.params.id, caregiverId);

  // Add caregiverId to activity data
  const activityData = {
    ...req.body,
    caregiverId: child.caregiverId || req.user._id
  };

  const activity = await childService.addActivity(req.params.id, activityData);

  res.status(201).json({
    success: true,
    message: 'Activity recorded successfully',
    data: activity
  });
});

// @desc    Generate child report PDF
// @route   GET /api/children/:id/report
// @access  Private
export const generateChildReport = asyncHandler(async (req, res) => {
  try {
    console.log('Generating PDF report for child:', req.params.id);
    const isExpertOrAdmin = req.user.role === 'expert' || req.user.role === 'admin';
    const caregiverId = isExpertOrAdmin ? null : req.user._id;

    // Verify access and get data
    const child = await childService.getChildById(req.params.id, caregiverId);
    console.log('Child data retrieved:', child.name);
    
    const stats = await childService.getChildStatistics(req.params.id);
    console.log('Stats retrieved:', stats);

    // Ensure stats have all required properties with defaults
    const safeStats = {
      totalActivities: stats.totalActivities || 0,
      averageScore: stats.averageScore || 0,
      totalGames: stats.totalGames || 0,
      totalAssessments: stats.totalAssessments || 0,
      totalTherapySessions: stats.totalTherapySessions || 0,
      byActivityType: stats.byActivityType || {},
      progressOverTime: stats.progressOverTime || [],
      recentActivities: stats.recentActivities || [],
      gamesList: stats.gamesList || [],
      assessmentsList: stats.assessmentsList || [],
      cognitiveAssessment: stats.cognitiveAssessment || null
    };

    // Create PDF document with professional styling
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      bufferPages: true
    });

    // Set response headers with proper CORS
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=child-report-${child.name.replace(/\s+/g, '-')}-${Date.now()}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);
    
    // Handle errors in the PDF stream
    doc.on('error', (err) => {
      console.error('PDF generation error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Error generating PDF' });
      }
    });

  // Define colors for professional look
  const primaryColor = '#61C3B4';
  const headerColor = '#2C3E50';
  const textColor = '#34495E';
  const lightGray = '#ECF0F1';
  
  // Helper function to add a section header
  const addSectionHeader = (text, yPosition = null) => {
    if (yPosition) doc.y = yPosition;
    doc.rect(50, doc.y, 495, 30).fill(primaryColor);
    doc.fillColor('#FFFFFF')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text(text, 50, doc.y + 8, { width: 495, align: 'left' });
    doc.moveDown(1.5);
    doc.fillColor(textColor).font('Helvetica');
  };

  // Add header with professional styling
  doc.fillColor(headerColor)
     .fontSize(26)
     .font('Helvetica-Bold')
     .text('CHILD PROGRESS REPORT', { align: 'center' });
  
  doc.fontSize(12)
     .fillColor(textColor)
     .font('Helvetica')
     .text(`Generated on ${new Date().toLocaleDateString('en-US', { 
       year: 'numeric', 
       month: 'long', 
       day: 'numeric' 
     })}`, { align: 'center' });
  
  doc.moveDown(2);

  // Add horizontal line
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(primaryColor);
  doc.moveDown(2);

  // SECTION 1: Child Information
  addSectionHeader('CHILD INFORMATION');
  
  const infoTable = [
    ['Full Name:', child.name],
    ['Age:', `${child.age} years old`],
    ['Gender:', child.gender],
    ['Date of Birth:', child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : 'Not specified']
  ];
  
  if (child.diagnosis) {
    infoTable.push(['Diagnosis:', child.diagnosis]);
  }
  if (child.specialNeeds) {
    infoTable.push(['Special Needs:', child.specialNeeds]);
  }

  infoTable.forEach(([label, value], index) => {
    const yPos = doc.y;
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(headerColor)
       .text(label, 70, yPos, { width: 150 });
    
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(textColor)
       .text(value, 230, yPos, { width: 300 });
    
    doc.moveDown(1.2);
  });

  doc.moveDown(1);

  // SECTION 2: Executive Summary
  addSectionHeader('EXECUTIVE SUMMARY');
  
  const performanceLevel = safeStats.averageScore >= 80 ? 'Excellent' :
                          safeStats.averageScore >= 60 ? 'Good' :
                          safeStats.averageScore >= 40 ? 'Fair' : 'Needs Support';
  
  doc.fontSize(11)
     .fillColor(textColor)
     .text(child.name + ' has completed a total of ', { continued: true })
     .font('Helvetica-Bold')
     .text(safeStats.totalActivities + ' activities ', { continued: true })
     .font('Helvetica')
     .text('with an overall average performance of ', { continued: true })
     .font('Helvetica-Bold')
     .text(safeStats.averageScore.toFixed(1) + '% ', { continued: true })
     .font('Helvetica')
     .text('which indicates a ', { continued: true })
     .font('Helvetica-Bold')
     .text(performanceLevel + ' ', { continued: true })
     .font('Helvetica')
     .text('level of achievement.');
  
  doc.moveDown(1);
  
  doc.fontSize(11)
     .font('Helvetica')
     .text('The child has engaged in ' + safeStats.totalGames + ' games, ' + safeStats.totalAssessments + ' assessments, and ' + safeStats.totalTherapySessions + ' therapy sessions, demonstrating consistent participation in the program.');
  
  doc.moveDown(2);

  // SECTION 3: Performance Overview
  addSectionHeader('PERFORMANCE OVERVIEW');
  
  // Statistics cards
  const statsData = [
    { label: 'Total Activities', value: String(safeStats.totalActivities) },
    { label: 'Games Played', value: String(safeStats.totalGames) },
    { label: 'Assessments', value: String(safeStats.totalAssessments) },
    { label: 'Therapy Sessions', value: String(safeStats.totalTherapySessions) },
    { label: 'Average Score', value: safeStats.averageScore.toFixed(1) + '%' }
  ];

  let xPos = 70;
  let yPos = doc.y;
  
  statsData.forEach((stat, index) => {
    // Create card background with gradient effect
    doc.rect(xPos, yPos, 90, 70)
       .fillAndStroke(lightGray, primaryColor);
    
    // Add decorative circle
    doc.circle(xPos + 45, yPos + 20, 12)
       .fill(primaryColor);
    
    // Add value
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor(headerColor)
       .text(stat.value, xPos, yPos + 35, { width: 90, align: 'center' });
    
    // Add label
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(textColor)
       .text(stat.label, xPos, yPos + 55, { width: 90, align: 'center' });
    
    xPos += 100;
    if ((index + 1) % 5 === 0) {
      xPos = 70;
      yPos += 80;
    }
  });

  doc.moveDown(8);

  // SECTION 4: Performance by Activity Type
  if (Object.keys(safeStats.byActivityType).length > 0) {
    addSectionHeader('DETAILED PERFORMANCE BY ACTIVITY TYPE');
    
    Object.entries(safeStats.byActivityType).forEach(([activityName, data], index) => {
      // Check if we need a new page
      if (doc.y > 650) {
        doc.addPage();
      }

      const yStart = doc.y;
      const boxHeight = 80;
      
      // Draw activity box
      doc.rect(70, yStart, 460, boxHeight)
         .fillAndStroke(lightGray, primaryColor);
      
      // Activity name
      doc.fontSize(13)
         .font('Helvetica-Bold')
         .fillColor(headerColor)
         .text(activityName, 85, yStart + 15);
      
      // Statistics
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(textColor)
         .text('Times Completed: ' + data.count, 85, yStart + 35);
      
      doc.text('Total Score: ' + data.totalScore.toFixed(0) + ' points', 85, yStart + 50);
      
      // Average score with visual indicator
      const avgScore = data.averageScore.toFixed(1);
      doc.text('Average Score: ' + avgScore + '%', 85, yStart + 65);
      
      // Progress bar
      const barWidth = 200;
      const barX = 320;
      const barY = yStart + 30;
      
      // Background bar
      doc.rect(barX, barY, barWidth, 15)
         .fillAndStroke('#E0E0E0', '#CCCCCC');
      
      // Filled bar
      const fillWidth = (barWidth * data.averageScore) / 100;
      const barColor = data.averageScore >= 80 ? '#27AE60' :
                      data.averageScore >= 60 ? primaryColor :
                      data.averageScore >= 40 ? '#F39C12' : '#E74C3C';
      
      doc.rect(barX, barY, fillWidth, 15)
         .fill(barColor);
      
      // Score percentage text on bar
      if (fillWidth > 35) {
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor('#FFFFFF')
           .text(avgScore + '%', barX + 5, barY + 3, { width: fillWidth - 10, align: 'right' });
      }
      
      doc.moveDown(6);
    });
  }

  // SECTION 5: Recent Activity History
  if (safeStats.recentActivities && safeStats.recentActivities.length > 0) {
    doc.addPage();
    addSectionHeader('RECENT ACTIVITY HISTORY');
    
    const activities = safeStats.recentActivities.slice(0, 10);
    
    // Table header
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF');
    
    doc.rect(70, doc.y, 460, 25).fill(headerColor);
    const headerY = doc.y + 7;
    
    doc.text('Activity Name', 80, headerY, { width: 150 });
    doc.text('Type', 240, headerY, { width: 60 });
    doc.text('Score', 310, headerY, { width: 60 });
    doc.text('Date', 380, headerY, { width: 140 });
    
    doc.moveDown(2);
    
    // Table rows
    activities.forEach((activity, index) => {
      const rowY = doc.y;
      const rowHeight = 20;
      
      // Alternate row colors
      if (index % 2 === 0) {
        doc.rect(70, rowY, 460, rowHeight).fill(lightGray);
      }
      
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(textColor);
      
      doc.text(activity.activityName || 'N/A', 80, rowY + 5, { width: 150 });
      doc.text(activity.activityType || 'N/A', 240, rowY + 5, { width: 60 });
      doc.text((activity.percentage?.toFixed(1) || 0) + '%', 310, rowY + 5, { width: 60 });
      doc.text(new Date(activity.completedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }), 380, rowY + 5, { width: 140 });
      
      doc.moveDown(1.5);
    });
  }

  // SECTION 6: Cognitive Assessment & Recommendations
  if (safeStats.cognitiveAssessment) {
    doc.addPage();
    addSectionHeader('COGNITIVE ASSESSMENT');
    
    // Overall Level
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(headerColor)
       .text('Overall Level: ', 70, doc.y, { continued: true })
       .fillColor(primaryColor)
       .text(safeStats.cognitiveAssessment.overallLevel || 'Not Available');
    
    doc.moveDown(0.5);
    
    // Progress Trend
    doc.font('Helvetica-Bold')
       .fillColor(headerColor)
       .text('Progress Trend: ', 70, doc.y, { continued: true })
       .fillColor(primaryColor)
       .text(safeStats.cognitiveAssessment.progressTrend || 'Not Available');
    
    doc.moveDown(2);
    
    // Strengths
    if (safeStats.cognitiveAssessment.strengths && safeStats.cognitiveAssessment.strengths.length > 0) {
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#27AE60')
         .text('STRENGTHS:', 70);
      
      doc.moveDown(0.5);
      
      safeStats.cognitiveAssessment.strengths.forEach(strength => {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(textColor)
           .text('+ ' + strength, 85, doc.y, { width: 450 });
        doc.moveDown(0.8);
      });
      
      doc.moveDown(1);
    }
    
    // Areas for Improvement
    if (safeStats.cognitiveAssessment.areasForImprovement && safeStats.cognitiveAssessment.areasForImprovement.length > 0) {
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#F39C12')
         .text('AREAS FOR IMPROVEMENT:', 70);
      
      doc.moveDown(0.5);
      
      safeStats.cognitiveAssessment.areasForImprovement.forEach(area => {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(textColor)
           .text('> ' + area, 85, doc.y, { width: 450 });
        doc.moveDown(0.8);
      });
      
      doc.moveDown(1);
    }
    
    // Recommendations
    if (safeStats.cognitiveAssessment.recommendations && safeStats.cognitiveAssessment.recommendations.length > 0) {
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#3498DB')
         .text('PROFESSIONAL RECOMMENDATIONS:', 70);
      
      doc.moveDown(0.5);
      
      safeStats.cognitiveAssessment.recommendations.forEach(rec => {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(textColor)
           .text('• ' + rec, 85, doc.y, { width: 450 });
        doc.moveDown(0.8);
      });
    }
  }

  // Footer on all pages
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    
    doc.fontSize(8)
       .fillColor('#95A5A6')
       .text(
         `AutiSmart - Child Development Report | Page ${i + 1} of ${range.count}`,
         50,
         doc.page.height - 50,
         { align: 'center' }
       );
    
    doc.text(
      'This report is confidential and intended for authorized caregivers and professionals only.',
      50,
      doc.page.height - 35,
      { align: 'center' }
    );
  }

  // Finalize PDF
  doc.end();
  } catch (error) {
    console.error('Error in generateChildReport:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        error: error.message
      });
    }
  }
});

// @desc    Generate Gemini AI scenario rounds for Emotion Explorer levels 7-10
// @route   POST /api/caregiver/children/:id/emotion-scenarios
// @access  Private (Caregiver / Admin)
export const getEmotionScenarios = asyncHandler(async (req, res) => {
  const child = await childService.getChildById(req.params.id, req.user._id);

  if (!child) {
    return res.status(404).json({ success: false, message: 'Child not found' });
  }

  const { level, levelName, pool, count } = req.body;

  const scenarios = await geminiService.generateEmotionScenarios({
    child,
    level: level ?? 7,
    levelName: levelName ?? 'Advanced',
    pool: Array.isArray(pool) ? pool : [],
    count: count ?? 10,
  });

  res.status(200).json({ success: true, scenarios });
});

// @desc    Generate Gemini AI feedback for Emotion Explorer game level
// @route   POST /api/caregiver/children/:id/emotion-feedback
// @access  Private (Caregiver / Admin)
export const getEmotionFeedback = asyncHandler(async (req, res) => {
  const child = await childService.getChildById(req.params.id, req.user._id);

  if (!child) {
    return res.status(404).json({ success: false, message: 'Child not found' });
  }

  const { level, levelName, score, maxScore, correctAnswers, incorrectAnswers, emotionsStruggled } = req.body;

  const feedback = await geminiService.generateEmotionFeedback({
    child,
    level: level ?? 1,
    levelName: levelName ?? 'Beginner',
    score: score ?? 0,
    maxScore: maxScore ?? 100,
    correctAnswers: correctAnswers ?? 0,
    incorrectAnswers: incorrectAnswers ?? 0,
    emotionsStruggled: emotionsStruggled ?? []
  });

  res.status(200).json({ success: true, feedback });
});

// @desc    Get game recommendations for a child based on assessment results
// @route   GET /api/caregiver/children/:id/recommendations
// @access  Private
export const getChildGameRecommendations = asyncHandler(async (req, res) => {
  const isExpertOrAdmin = req.user.role === 'expert' || req.user.role === 'admin';
  const caregiverId = isExpertOrAdmin ? null : req.user._id;

  // Verify the requesting user has access to this child
  await childService.getChildById(req.params.id, caregiverId);

  const data = await recommendationService.getGameRecommendations(req.params.id);

  res.status(200).json({
    success: true,
    data,
  });
});
