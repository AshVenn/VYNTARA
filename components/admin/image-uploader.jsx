"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function ImageUploader({ label, name, publicIdName, multiple = false, initial = [] }) {
  const [items, setItems] = useState(
    initial.map((item) => ({
      url: item.url,
      publicId: item.publicId || "",
    })),
  )
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    setIsUploading(true)
    try {
      const signatureRes = await fetch("/api/cloudinary/signature")
      const signatureData = await signatureRes.json()

      const uploads = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("api_key", signatureData.apiKey)
          formData.append("timestamp", signatureData.timestamp)
          formData.append("signature", signatureData.signature)

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
            { method: "POST", body: formData },
          )

          if (!response.ok) {
            throw new Error("Upload failed")
          }

          return response.json()
        }),
      )

      setItems((prev) => {
        const next = multiple ? [...prev, ...uploads] : uploads
        return next.map((upload) => ({
          url: upload.secure_url,
          publicId: upload.public_id,
        }))
      })
    } catch (error) {
      console.error(error)
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  const handleRemove = async (publicId) => {
    if (!publicId) {
      setItems((prev) => prev.filter((item) => item.publicId !== publicId))
      return
    }

    await fetch("/api/cloudinary/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    })

    setItems((prev) => prev.filter((item) => item.publicId !== publicId))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="file" accept="image/*" multiple={multiple} className="hidden" onChange={handleUpload} />
          <Button type="button" variant="outline" size="sm" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </label>
      </div>

      <input type="hidden" name={name} value={items.map((item) => item.url).join(", ")} />
      <input type="hidden" name={publicIdName} value={items.map((item) => item.publicId).join(", ")} />

      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map((item) => (
            <div key={item.url} className="relative border border-border overflow-hidden">
              <img src={item.url} alt="Uploaded" className="w-full h-24 object-cover" />
              <button
                type="button"
                className="absolute top-1 right-1 text-xs bg-background/80 px-2 py-1"
                onClick={() => handleRemove(item.publicId)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
