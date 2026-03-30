import { Router, Request, Response } from 'express';
import { 
  addCompany, 
  getAllCompanies, 
  getCompanyById, 
  updateCompany, 
  deleteCompany,
  getCompanyByName 
} from '../db';
import { authenticateToken } from '../middleware';

const router = Router();

// Get all companies (accessible to logged-in users)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const companies = await getAllCompanies();
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Get company by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const company = await getCompanyById(Number(req.params.id));
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// Create new company (admin only)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Only admins can create companies
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create companies' });
    }

    const { name, logo, address, phone, email, website } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    // Check if company already exists
    const existing = await getCompanyByName(name);
    if (existing) {
      return res.status(400).json({ error: 'Company with this name already exists' });
    }

    const company = await addCompany({
      name,
      logo: logo || undefined,
      address: address || undefined,
      phone: phone || undefined,
      email: email || undefined,
      website: website || undefined,
    });

    res.status(201).json(company);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// Update company (admin only)
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Only admins can update companies
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update companies' });
    }

    const company = await updateCompany(Number(req.params.id), req.body);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// Delete company (admin only)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Only admins can delete companies
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete companies' });
    }

    const success = await deleteCompany(Number(req.params.id));
    
    if (!success) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

export default router;
