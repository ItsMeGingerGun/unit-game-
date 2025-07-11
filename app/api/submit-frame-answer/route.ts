// app/api/submit-frame-answer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neynar } from '@neynar/nodejs-sdk';
import game from '@/lib/game'; // Updated import

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const trustedData = body.trustedData;
    const untrustedData = body.untrustedData;
    
    // Parse state from frame
    const state = untrustedData.state ? JSON.parse(untrustedData.state) : {};
    const answer = untrustedData.inputText || '';
    const puzzleId = state.puzzleId;
    const correctAnswer = state.correctAnswer; // Add this
    const fid = state.fid || untrustedData.fid;

    // Validate frame action
    const neynarClient = new neynar.ApiClient(process.env.NEYNAR_API_KEY!);
    await neynarClient.validateFrameAction(trustedData.messageBytes);
    
    // Check answer
    const isCorrect = game.checkAnswer(parseFloat(answer), correctAnswer); // Updated call
    
    // Build response
    return NextResponse.json({
      type: 'frame',
      frame: {
        version: 'vNext',
        image: `${process.env.NEXT_PUBLIC_BASE_URL}/api/result-image?correct=${isCorrect}&answer=${encodeURIComponent(answer)}`,
        buttons: [
          { label: 'Play Again', action: 'post', target: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame` }
        ],
        postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
        state: {
          fid,
          puzzleId,
          correctAnswer,
          previousAnswer: answer
        }
      }
    });
    
  } catch (error) {
    console.error('Answer submission failed:', error);
    return NextResponse.json({
      type: 'frame',
      frame: {
        version: 'vNext',
        image: `${process.env.NEXT_PUBLIC_BASE_URL}/api/error-image`,
        buttons: [{ label: 'Try Again', action: 'post' }],
        postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame`,
      }
    }, { status: 500 });
  }
}
