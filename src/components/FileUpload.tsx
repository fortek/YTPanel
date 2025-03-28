import { useState } from 'react'

interface Props {
  onSuccess: () => void
}

export function FileUpload({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const text = await file.text()
      const accounts = text.split('\n')

      const response = await fetch('/api/lists/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name.replace('.txt', ''),
          accounts
        })
      })

      if (!response.ok) throw new Error('Upload failed')
      
      onSuccess()
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <input
        type="file"
        accept=".txt"
        onChange={handleFileChange}
        disabled={loading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className={`p-2 text-center border-2 border-dashed rounded ${loading ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
        {loading ? 'Uploading...' : 'Upload List'}
      </div>
    </div>
  )
} 