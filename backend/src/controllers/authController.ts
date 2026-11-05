// ============================================================
// d:\ABHAYA\backend\src\controllers\authController.ts
// ============================================================

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import store from '../services/store';
import { JWTPayload, User, UserProfile, UserRole } from '../types';
import { sendSuccess, sendError } from '../utils/response';

const JWT_SECRET = process.env.JWT_SECRET || 'abhaya_super_secure_jwt_secret_dev_mode_2026';
const JWT_EXPIRES_IN = '7d';

function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    abhayaId: user.abhaya_id,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, phone, password, full_name, role = 'primary_user', preferred_language = 'en' } = req.body;

    if (!email || !phone || !password || !full_name) {
      sendError(res, 'Email, phone, password and full name are required', 400);
      return;
    }

    // Check if user already exists
    for (const u of store.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        sendError(res, 'Email is already registered', 409);
        return;
      }
      if (u.phone === phone) {
        sendError(res, 'Phone number is already registered', 409);
        return;
      }
    }

    const salt = bcrypt.genSaltSync(10);
    const userId = uuidv4();
    const count = store.users.size + 1;
    const abhayaId = `ABHAYA-USER-${1000 + count}`;

    const newUser: User = {
      id: userId,
      abhaya_id: abhayaId,
      email: email.toLowerCase(),
      phone,
      password_hash: bcrypt.hashSync(password, salt),
      role: role as UserRole,
      status: 'active',
      email_verified: false,
      phone_verified: false,
      fcm_token: null,
      last_active_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const newProfile: UserProfile = {
      id: uuidv4(),
      user_id: userId,
      full_name,
      display_name: full_name.split(' ')[0],
      date_of_birth: null,
      gender: null,
      profile_picture_url: null,
      bio: '',
      preferred_language,
      home_location: null,
      work_location: null,
      emergency_message: 'Emergency SOS activated via ABHAYA.',
      created_at: new Date(),
      updated_at: new Date(),
    };

    store.users.set(userId, newUser);
    store.profiles.set(userId, newProfile);

    const token = generateToken(newUser);

    sendSuccess(
      res,
      {
        token,
        user: {
          id: newUser.id,
          abhayaId: newUser.abhaya_id,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          profile: newProfile,
        },
      },
      'User registered successfully',
      201
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Registration failed: ${msg}`, 500);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      sendError(res, 'Email/phone and password are required', 400);
      return;
    }

    let foundUser: User | null = null;
    for (const u of store.users.values()) {
      if (
        u.email.toLowerCase() === emailOrPhone.toLowerCase() ||
        u.phone === emailOrPhone ||
        u.abhaya_id.toLowerCase() === emailOrPhone.toLowerCase()
      ) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const isMatch = bcrypt.compareSync(password, foundUser.password_hash);
    if (!isMatch) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    foundUser.last_active_at = new Date();
    const token = generateToken(foundUser);
    const profile = store.profiles.get(foundUser.id);

    sendSuccess(res, {
      token,
      user: {
        id: foundUser.id,
        abhayaId: foundUser.abhaya_id,
        email: foundUser.email,
        phone: foundUser.phone,
        role: foundUser.role,
        profile: profile || null,
      },
    }, 'Login successful');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Login failed: ${msg}`, 500);
  }
}

export async function demoLogin(req: Request, res: Response): Promise<void> {
  try {
    const { role = 'primary_user' } = req.body;

    let targetEmail = 'priya@abhaya.demo';
    if (role === 'trusted_contact') {
      targetEmail = 'rahul@abhaya.demo';
    } else if (role === 'admin') {
      targetEmail = 'admin@abhaya.demo';
    }

    let foundUser: User | null = null;
    for (const u of store.users.values()) {
      if (u.email === targetEmail) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      sendError(res, 'Demo account not initialized', 500);
      return;
    }

    const token = generateToken(foundUser);
    const profile = store.profiles.get(foundUser.id);

    sendSuccess(res, {
      token,
      isDemo: true,
      user: {
        id: foundUser.id,
        abhayaId: foundUser.abhaya_id,
        email: foundUser.email,
        phone: foundUser.phone,
        role: foundUser.role,
        profile: profile || null,
      },
    }, `Logged in as demo ${role}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Demo login failed: ${msg}`, 500);
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const currentUser = (req as any).user as JWTPayload;
    if (!currentUser) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const user = store.users.get(currentUser.userId);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const profile = store.profiles.get(user.id);
    sendSuccess(res, {
      id: user.id,
      abhayaId: user.abhaya_id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profile: profile || null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to get current user: ${msg}`, 500);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  sendSuccess(res, { loggedOut: true }, 'Successfully logged out');
}
