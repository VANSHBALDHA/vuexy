import { hash } from 'bcryptjs';
import { connectToDatabase } from '../mongodb/mongodb';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, password, username } = await req.json();

  // Validate inputs
  if (!email || !password || !username) {
    return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('usersses');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create the user in the database
    const newUser = {
      email,
      name: username,
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: result.insertedId,
          email: newUser.email,
          name: newUser.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error:', error.message);
    return NextResponse.json({ message: 'Something went wrong', error: error.message }, { status: 500 });
  }
}
