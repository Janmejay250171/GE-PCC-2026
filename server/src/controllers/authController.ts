import { Request, Response } from 'express';
import crypto from 'crypto';
import { User, SavedHospitalData } from '../models/User.js';
import { Policy } from '../models/Policy.js';

function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const checkHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(checkHash, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  return await User.findOne({ token });
}

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: { message: 'Name is required.' } });
      return;
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      res.status(400).json({ error: { message: 'Valid email address is required.' } });
      return;
    }

    const emailNorm = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNorm)) {
      res.status(400).json({ error: { message: 'Please enter a valid email address (e.g. yourname@gmail.com).' } });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: { message: 'Password must be at least 6 characters long.' } });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: { message: 'Passwords do not match. Please re-enter.' } });
      return;
    }

    const existing = await User.findOne({ email: emailNorm });
    if (existing) {
      res.status(409).json({ error: { message: 'An account with this email already exists. Please log in.' } });
      return;
    }

    const { hash, salt } = hashPassword(password);
    const token = generateToken();

    const newUser = new User({
      name: name.trim(),
      email: emailNorm,
      passwordHash: hash,
      salt,
      token,
      savedHospitals: [],
      savedPolicyIds: []
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      },
      token,
      savedHospitals: [],
      savedPolicyIds: []
    });
  } catch (err: any) {
    console.error('[Signup Error]:', err);
    res.status(500).json({ error: { message: err.message || 'Failed to sign up.' } });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: { message: 'Email and password are required.' } });
      return;
    }

    const emailNorm = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: emailNorm });

    if (!user) {
      res.status(401).json({ error: { message: 'Invalid email or password.' } });
      return;
    }

    const isValid = verifyPassword(String(password), user.passwordHash, user.salt);
    if (!isValid) {
      res.status(401).json({ error: { message: 'Invalid email or password.' } });
      return;
    }

    const token = generateToken();
    user.token = token;
    await user.save();

    res.json({
      success: true,
      message: 'Logged in successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token,
      savedHospitals: user.savedHospitals || [],
      savedPolicyIds: user.savedPolicyIds || []
    });
  } catch (err: any) {
    console.error('[Login Error]:', err);
    res.status(500).json({ error: { message: err.message || 'Failed to log in.' } });
  }
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ error: { message: 'Unauthorized. Please log in.' } });
      return;
    }

    // Retrieve policies linked to this user
    const policies = await Policy.find({
      $or: [
        { _id: { $in: user.savedPolicyIds || [] } }
      ]
    }).sort({ updatedAt: -1 });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      savedHospitals: user.savedHospitals || [],
      policies
    });
  } catch (err: any) {
    console.error('[Get Profile Error]:', err);
    res.status(500).json({ error: { message: err.message || 'Failed to fetch profile.' } });
  }
}

export async function toggleSaveHospital(req: Request, res: Response): Promise<void> {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ error: { message: 'Please log in to save hospitals.' } });
      return;
    }

    const hospitalData = req.body as SavedHospitalData;
    if (!hospitalData || !hospitalData.hospital_name) {
      res.status(400).json({ error: { message: 'Hospital details required.' } });
      return;
    }

    const key = hospitalData.hospitalKey || `${hospitalData.hospital_name}_${hospitalData.address || ''}`;
    const existingIndex = user.savedHospitals.findIndex(h => h.hospitalKey === key || h.hospital_name === hospitalData.hospital_name);

    let isSaved = false;
    if (existingIndex >= 0) {
      // Unsave
      user.savedHospitals.splice(existingIndex, 1);
      isSaved = false;
    } else {
      // Save
      user.savedHospitals.push({
        hospitalKey: key,
        hospital_name: hospitalData.hospital_name,
        address: hospitalData.address || '',
        city: hospitalData.city || '',
        hospital_type: hospitalData.hospital_type || 'Private',
        tier: hospitalData.tier || 'Tier 2',
        segment: hospitalData.segment || 'Standard',
        rating: Number(hospitalData.rating) || 0,
        fitScore: Number(hospitalData.fitScore) || 0,
        savedAt: new Date().toISOString()
      });
      isSaved = true;
    }

    await user.save();

    res.json({
      success: true,
      isSaved,
      savedHospitals: user.savedHospitals
    });
  } catch (err: any) {
    console.error('[Toggle Save Hospital Error]:', err);
    res.status(500).json({ error: { message: err.message || 'Failed to toggle save hospital.' } });
  }
}

export async function linkPolicyToUser(req: Request, res: Response): Promise<void> {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ error: { message: 'Unauthorized' } });
      return;
    }

    const { policyId } = req.body;
    if (policyId && !user.savedPolicyIds.includes(policyId)) {
      user.savedPolicyIds.push(policyId);
      await user.save();
    }

    res.json({ success: true, savedPolicyIds: user.savedPolicyIds });
  } catch (err: any) {
    console.error('[Link Policy Error]:', err);
    res.status(500).json({ error: { message: err.message || 'Failed to link policy.' } });
  }
}
