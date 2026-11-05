// ============================================================
// d:\ABHAYA\backend\src\controllers\communityController.ts
// Community Safety Feed & Dynamic Reporting Module
// ============================================================

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import store from '../services/store';
import { JWTPayload, CommunityReport, CommunityPost } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export async function submitReport(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user as JWTPayload;
    const {
      category = 'streetlight',
      lat = 28.626,
      lng = 77.065,
      address = 'Pankha Road crossing, New Delhi',
      roadSegmentId = 'seg-002',
      description,
      imageUrls = [],
    } = req.body;

    if (!description || description.trim().length < 5) {
      sendError(res, 'A meaningful description of the safety concern is required', 400);
      return;
    }

    const reportId = uuidv4();
    const newReport: CommunityReport = {
      id: reportId,
      user_id: authUser.userId,
      category,
      lat,
      lng,
      address,
      road_segment_id: roadSegmentId,
      description: description.trim(),
      image_urls: imageUrls,
      status: 'pending',
      verification_notes: null,
      verified_by: null,
      verified_at: null,
      expires_at: new Date(Date.now() + 86400000 * 7), // 7 days validity
      created_at: new Date(),
      updated_at: new Date(),
    };

    store.reports.set(reportId, newReport);

    sendSuccess(
      res,
      newReport,
      'Safety report submitted! It is currently under verification by our moderation team.',
      201
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to submit safety report: ${msg}`, 500);
  }
}

export async function getReports(req: Request, res: Response): Promise<void> {
  try {
    const { category, status } = req.query;
    let list = Array.from(store.reports.values());

    if (category) {
      list = list.filter((r) => r.category === category);
    }
    if (status) {
      list = list.filter((r) => r.status === status);
    }

    // Sort by recency
    list.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    sendSuccess(res, list);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to get reports: ${msg}`, 500);
  }
}

export async function getPosts(req: Request, res: Response): Promise<void> {
  try {
    const { category } = req.query;
    let list = Array.from(store.posts.values());

    if (category && category !== 'all') {
      list = list.filter((p) => p.category === category);
    }

    // Pinned posts first, then recency
    list.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return b.created_at.getTime() - a.created_at.getTime();
    });

    sendSuccess(res, list);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to fetch posts: ${msg}`, 500);
  }
}

export async function createPost(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user as JWTPayload;
    const { title, content, category = 'general_safety', areaName = 'West Delhi', isAnonymous = false } = req.body;

    if (!title || !content) {
      sendError(res, 'Title and content are required', 400);
      return;
    }

    const profile = store.profiles.get(authUser.userId);
    const authorName = isAnonymous ? 'Anonymous Member' : (profile?.display_name || profile?.full_name || 'Member');

    const postId = uuidv4();
    const newPost: CommunityPost = {
      id: postId,
      user_id: authUser.userId,
      author_display_name: authorName,
      is_anonymous: isAnonymous,
      title: title.trim(),
      content: content.trim(),
      category,
      lat: 28.6186,
      lng: 77.0545,
      area_name: areaName,
      likes_count: 0,
      comments_count: 0,
      is_pinned: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    store.posts.set(postId, newPost);

    sendSuccess(res, newPost, 'Community post published', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to create post: ${msg}`, 500);
  }
}

export async function likePost(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const post = store.posts.get(id);
    if (!post) {
      sendError(res, 'Post not found', 404);
      return;
    }

    post.likes_count = (post.likes_count || 0) + 1;
    sendSuccess(res, { likesCount: post.likes_count });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendError(res, `Failed to like post: ${msg}`, 500);
  }
}
