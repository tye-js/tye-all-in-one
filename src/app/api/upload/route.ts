import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { mediaFiles } from '@/lib/db/schema';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'application/pdf',
];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    
    // Determine upload directory based on file type
    let uploadDir = 'general';
    if (file.type.startsWith('image/')) {
      uploadDir = 'images';
    } else if (file.type.startsWith('audio/')) {
      uploadDir = 'audio';
    } else if (file.type === 'application/pdf') {
      uploadDir = 'documents';
    }

    // Create upload directory if it doesn't exist
    const uploadsPath = join(process.cwd(), 'public', 'uploads', uploadDir);
    try {
      await mkdir(uploadsPath, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Save file to disk
    const filePath = join(uploadsPath, uniqueFilename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // Save file info to database
    const fileUrl = `/uploads/${uploadDir}/${uniqueFilename}`;
    
    const newMediaFile = await db
      .insert(mediaFiles)
      .values({
        filename: uniqueFilename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: fileUrl,
        uploadedBy: session.user.id,
      })
      .returning();

    return NextResponse.json({
      id: newMediaFile[0].id,
      url: fileUrl,
      filename: uniqueFilename,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
