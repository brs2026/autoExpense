import { NextResponse } from "next/server";

import { adminClient } from "@/lib/supabase/server-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { username, password, full_name, role } = body;

    if (!username || !password || !full_name || !role) {
      return NextResponse.json(
        {
          error: "Missing fields",
        },
        {
          status: 400,
        }
      );
    }

    const email = `${username}@autoexpense.app`;

    // Create auth user
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json(
        {
          error: authError.message,
        },
        {
          status: 400,
        }
      );
    }

    // Create profile
    const { error: profileError } = await adminClient.from("users").insert({
      id: authData.user.id,
      username,
      full_name,
      role,
      is_active: true,
    });

    if (profileError) {
      return NextResponse.json(
        {
          error: profileError.message,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Server error",
      },
      {
        status: 500,
      }
    );
  }
}
