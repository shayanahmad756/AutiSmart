import express from 'express';
import * as childController from '../controllers/childController.js';
import { verifyToken } from '../middleware/index.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get all children (for experts and admins)
router.get('/all-children', childController.getAllChildren);

// Child management routes
router.post('/children', childController.addChild);
router.get('/children', childController.getChildren);
router.get('/children/:id', childController.getChild);
router.put('/children/:id', childController.updateChild);
router.delete('/children/:id', childController.deleteChild);

// Activity and stats routes
router.get('/children/:id/stats', childController.getChildStats);
router.get('/children/:id/activities', childController.getChildActivities);
router.post('/children/:id/activities', childController.addActivity);

// Report route
router.get('/children/:id/report', childController.generateChildReport);

// Emotion Explorer AI scenario generation route (levels 7-10)
router.post('/children/:id/emotion-scenarios', childController.getEmotionScenarios);

// Emotion Explorer AI feedback route
router.post('/children/:id/emotion-feedback', childController.getEmotionFeedback);

// Game recommendation route
router.get('/children/:id/recommendations', childController.getChildGameRecommendations);

export default router;
