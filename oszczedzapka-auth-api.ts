import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import { UserModel } from '@/models';
import { generateToken } from '@/app/lib/auth';
import { loginSchema, signupSchema } from '@/app/lib/validation';
import { ApiResponse, AuthResponse } from '@/app/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  try {
    await connectDB();
    const body = await request.json();
    
    if (params.action === 'login') {
      // Validate input
      const validatedData = loginSchema.parse(body);
      
      // Find user
      const user = await UserModel.findOne({ username: validatedData.username });
      if (!user) {
        return NextResponse.json<ApiResponse<never>>(
          { success: false, error: 'Nieprawidłowa nazwa użytkownika lub hasło' },
          { status: 401 }
        );
      }
      
      // Check password
      const isPasswordValid = await user.comparePassword(validatedData.password);
      if (!isPasswordValid) {
        return NextResponse.json<ApiResponse<never>>(
          { success: false, error: 'Nieprawidłowa nazwa użytkownika lub hasło' },
          { status: 401 }
        );
      }
      
      // Generate token
      const token = generateToken(user);
      
      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: {
          token,
          user: {
            _id: user._id.toString(),
            email: user.email,
            username: user.username,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      };
      
      return NextResponse.json(response);
    } 
    
    else if (params.action === 'signup') {
      // Validate input
      const validatedData = signupSchema.parse(body);
      
      // Check if user already exists
      const existingUser = await UserModel.findOne({
        $or: [
          { email: validatedData.email },
          { username: validatedData.username }
        ]
      });
      
      if (existingUser) {
        return NextResponse.json<ApiResponse<never>>(
          { 
            success: false, 
            error: existingUser.email === validatedData.email 
              ? 'Email jest już zarejestrowany' 
              : 'Nazwa użytkownika jest już zajęta' 
          },
          { status: 400 }
        );
      }
      
      // Create user
      const user = await UserModel.create({
        email: validatedData.email,
        username: validatedData.username,
        password: validatedData.password,
      });
      
      // Generate token
      const token = generateToken(user);
      
      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: {
          token,
          user: {
            _id: user._id.toString(),
            email: user.email,
            username: user.username,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      };
      
      return NextResponse.json(response, { status: 201 });
    }
    
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Nieprawidłowa akcja' },
      { status: 404 }
    );
    
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Auth error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Wystąpił błąd serwera' },
      { status: 500 }
    );
  }
}