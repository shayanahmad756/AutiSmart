/**
 * Seed Script for Assessments
 * Creates sample assessments for all levels
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Assessment from '../models/Assessment.js';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const sampleAssessments = [
  {
    level: 'easy',
    title: 'Level 1 - Basic Autism Assessment',
    description: 'Initial screening for basic autism characteristics',
    questions: [
      {
        id: 'easy_q1',
        category: 'Eye Contact',
        question: 'How often does the child make eye contact during conversations?',
        options: ['Frequently maintains eye contact', 'Sometimes makes eye contact', 'Rarely or never makes eye contact'],
        scores: [1, 2, 3]
      },
      {
        id: 'easy_q2',
        category: 'Social Interaction',
        question: 'How does the child respond to social situations with peers?',
        options: ['Actively engages with peers', 'Shows some interest but hesitant', 'Avoids or shows no interest'],
        scores: [1, 2, 3]
      },
      {
        id: 'easy_q3',
        category: 'Communication',
        question: 'How does the child express their needs and wants?',
        options: ['Uses clear verbal communication', 'Uses gestures or limited words', 'Has difficulty expressing needs'],
        scores: [1, 2, 3]
      },
      {
        id: 'easy_q4',
        category: 'Repetitive Behavior',
        question: 'Does the child engage in repetitive movements or actions?',
        options: ['No repetitive behaviors', 'Occasional repetitive actions', 'Frequent repetitive behaviors'],
        scores: [1, 2, 3]
      },
      {
        id: 'easy_q5',
        category: 'Sensory Sensitivity',
        question: 'How does the child react to sensory stimuli (sounds, lights, textures)?',
        options: ['Typical reactions', 'Sometimes oversensitive', 'Highly sensitive or avoidant'],
        scores: [1, 2, 3]
      }
    ],
    isActive: true,
    formDefinition: []
  },
  {
    level: 'intermediate',
    title: 'Level 2 - Intermediate Autism Assessment',
    description: 'Detailed assessment for identifying moderate autism characteristics',
    questions: [
      {
        id: 'int_q1',
        category: 'Social Interaction',
        question: 'How does the child handle changes in routine or unexpected events?',
        options: ['Adapts easily to changes', 'Shows some distress but recovers', 'Becomes very upset or resistant'],
        scores: [1, 2, 3]
      },
      {
        id: 'int_q2',
        category: 'Communication',
        question: 'Can the child understand and use non-verbal communication (gestures, facial expressions)?',
        options: ['Understands and uses effectively', 'Limited understanding or use', 'Rarely understands or uses'],
        scores: [1, 2, 3]
      },
      {
        id: 'int_q3',
        category: 'Focus & Attention',
        question: 'How long can the child maintain attention on a task?',
        options: ['Age-appropriate attention span', 'Shorter than typical attention span', 'Very brief or easily distracted'],
        scores: [1, 2, 3]
      },
      {
        id: 'int_q4',
        category: 'Repetitive Behavior',
        question: 'Does the child have intense, focused interests in specific topics?',
        options: ['Varied interests', 'Strong preference for certain topics', 'Extremely focused on one topic'],
        scores: [1, 2, 3]
      },
      {
        id: 'int_q5',
        category: 'Social Interaction',
        question: 'How does the child engage in imaginative or pretend play?',
        options: ['Engages in varied pretend play', 'Limited or repetitive pretend play', 'Does not engage in pretend play'],
        scores: [1, 2, 3]
      },
      {
        id: 'int_q6',
        category: 'Communication',
        question: 'Does the child understand jokes, sarcasm, or figurative language?',
        options: ['Usually understands', 'Sometimes understands with help', 'Takes language literally'],
        scores: [1, 2, 3]
      }
    ],
    isActive: true,
    formDefinition: []
  },
  {
    level: 'advanced',
    title: 'Level 3 - Advanced Autism Assessment',
    description: 'Comprehensive assessment for identifying complex autism characteristics',
    questions: [
      {
        id: 'adv_q1',
        category: 'Social Interaction',
        question: 'How does the child recognize and respond to others\' emotions?',
        options: ['Recognizes and responds appropriately', 'Sometimes recognizes but unsure how to respond', 'Difficulty recognizing emotions'],
        scores: [1, 2, 3]
      },
      {
        id: 'adv_q2',
        category: 'Communication',
        question: 'Can the child maintain a back-and-forth conversation?',
        options: ['Yes, maintains conversations well', 'Sometimes, but may go off-topic', 'Rarely maintains conversation flow'],
        scores: [1, 2, 3]
      },
      {
        id: 'adv_q3',
        category: 'Social Interaction',
        question: 'Does the child seek to share interests or achievements with others?',
        options: ['Frequently shares with others', 'Occasionally shares', 'Rarely or never shares'],
        scores: [1, 2, 3]
      },
      {
        id: 'adv_q4',
        category: 'Repetitive Behavior',
        question: 'Does the child insist on sameness or become distressed by small changes?',
        options: ['Flexible with changes', 'Prefers routine but adapts', 'Very rigid, distressed by changes'],
        scores: [1, 2, 3]
      },
      {
        id: 'adv_q5',
        category: 'Communication',
        question: 'How does the child use and understand body language in social situations?',
        options: ['Uses appropriately', 'Limited or awkward use', 'Does not use or understand'],
        scores: [1, 2, 3]
      },
      {
        id: 'adv_q6',
        category: 'Focus & Attention',
        question: 'Can the child shift attention between activities smoothly?',
        options: ['Shifts attention easily', 'Sometimes has difficulty', 'Very difficult, gets stuck on tasks'],
        scores: [1, 2, 3]
      },
      {
        id: 'adv_q7',
        category: 'Sensory Sensitivity',
        question: 'Does the child show unusual responses to pain, temperature, or sensory input?',
        options: ['Typical responses', 'Sometimes unusual responses', 'Frequently unusual responses'],
        scores: [1, 2, 3]
      }
    ],
    isActive: true,
    formDefinition: []
  },
  {
    level: 'sensory',
    title: 'Bonus - Sensory & Attention Assessment',
    description: 'Specialized assessment focusing on sensory processing and attention patterns',
    questions: [
      {
        id: 'sen_q1',
        category: 'Sensory Sensitivity',
        question: 'How does the child react to loud or unexpected noises?',
        options: ['Normal reaction', 'Startles easily or covers ears', 'Extreme distress or meltdown'],
        scores: [1, 2, 3]
      },
      {
        id: 'sen_q2',
        category: 'Sensory Sensitivity',
        question: 'Does the child have strong preferences or aversions to certain textures (food, clothing)?',
        options: ['Few or no texture issues', 'Some texture preferences', 'Very strong aversions'],
        scores: [1, 2, 3]
      },
      {
        id: 'sen_q3',
        category: 'Focus & Attention',
        question: 'Can the child filter out background noise to focus on important sounds?',
        options: ['Filters effectively', 'Sometimes distracted', 'Very distracted by background sounds'],
        scores: [1, 2, 3]
      },
      {
        id: 'sen_q4',
        category: 'Sensory Sensitivity',
        question: 'How does the child respond to bright lights or visual stimuli?',
        options: ['Normal response', 'Squints or avoids bright lights', 'Strong aversion or distress'],
        scores: [1, 2, 3]
      },
      {
        id: 'sen_q5',
        category: 'Focus & Attention',
        question: 'Does the child have difficulty transitioning between activities?',
        options: ['Transitions smoothly', 'Needs reminders or time', 'Very difficult, resists transitions'],
        scores: [1, 2, 3]
      },
      {
        id: 'sen_q6',
        category: 'Sensory Sensitivity',
        question: 'Does the child seek or avoid physical touch and close contact?',
        options: ['Comfortable with touch', 'Selective about touch', 'Strongly avoids or seeks touch'],
        scores: [1, 2, 3]
      }
    ],
    isActive: true,
    formDefinition: []
  }
];

async function seedAssessments() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Find an admin user to set as creator
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('⚠️  No admin user found. Please create an admin user first.');
      console.log('Run: node scripts/createAdmin.js');
      process.exit(1);
    }

    console.log(`✅ Using admin user: ${adminUser.email}`);

    // Check if assessments already exist
    const existingCount = await Assessment.countDocuments();
    console.log(`📊 Current assessments in database: ${existingCount}`);

    if (existingCount > 0) {
      console.log('⚠️  Assessments already exist. Do you want to:');
      console.log('   1. Skip seeding (keep existing)');
      console.log('   2. Delete all and reseed');
      console.log('');
      console.log('To delete and reseed, run: node seedAssessments.js --force');
      
      if (!process.argv.includes('--force')) {
        console.log('Exiting without changes...');
        process.exit(0);
      }

      console.log('🗑️  Deleting existing assessments...');
      await Assessment.deleteMany({});
      console.log('✅ Deleted all existing assessments');
    }

    console.log('📝 Creating sample assessments...');
    
    // Add createdBy field to all assessments
    const assessmentsWithCreator = sampleAssessments.map(assessment => ({
      ...assessment,
      createdBy: adminUser._id,
      updatedBy: adminUser._id
    }));
    
    const created = await Assessment.insertMany(assessmentsWithCreator);
    
    console.log(`✅ Successfully created ${created.length} assessments:`);
    created.forEach(assessment => {
      console.log(`   - ${assessment.title} (${assessment.level})`);
    });

    console.log('\n✨ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding assessments:', error);
    process.exit(1);
  }
}

// Run the seed function
seedAssessments();
