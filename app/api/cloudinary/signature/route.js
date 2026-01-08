import { NextResponse } from "next/server"
import { getCloudinaryConfig, signCloudinaryParams } from "@/lib/cloudinary"

export async function GET() {
  try {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig()
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = signCloudinaryParams({ timestamp }, apiSecret)

    return NextResponse.json({ cloudName, apiKey, timestamp, signature })
  } catch (error) {
    return NextResponse.json({ error: "Cloudinary config missing" }, { status: 500 })
  }
}
