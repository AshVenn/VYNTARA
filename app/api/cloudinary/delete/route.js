import { NextResponse } from "next/server"
import { getCloudinaryConfig, signCloudinaryParams } from "@/lib/cloudinary"

export async function POST(request) {
  try {
    const { publicId } = await request.json()
    if (!publicId) {
      return NextResponse.json({ error: "Missing publicId" }, { status: 400 })
    }

    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig()
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = signCloudinaryParams({ public_id: publicId, timestamp }, apiSecret)

    const formData = new FormData()
    formData.append("public_id", publicId)
    formData.append("api_key", apiKey)
    formData.append("timestamp", timestamp.toString())
    formData.append("signature", signature)

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
  }
}
