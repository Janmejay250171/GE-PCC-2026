import { Router } from 'express';
import {
  getCities,
  getTaxonomy,
  searchHospitals,
  getHospitalCostBreakdown
} from '../controllers/hospitalController.js';

const router = Router();

router.get('/cities', getCities);
router.get('/taxonomy', getTaxonomy);
router.post('/search', searchHospitals);
router.post('/breakdown', getHospitalCostBreakdown);

export default router;
