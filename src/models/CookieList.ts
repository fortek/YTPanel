import mongoose from 'mongoose'

const cookieChunkSchema = new mongoose.Schema({
  listId: { type: mongoose.Schema.Types.ObjectId, required: true },
  cookies: { type: [String], required: true },
  chunkIndex: { type: Number, required: true }
}, { 
  timestamps: true,
  versionKey: false
})

const cookieListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  totalCookies: { type: Number, required: true },
  chunksCount: { type: Number, required: true }
}, { 
  timestamps: true,
  versionKey: false
})

// Создаем составной индекс для быстрого поиска чанков
cookieChunkSchema.index({ listId: 1, chunkIndex: 1 })

export const CookieList = mongoose.models.CookieList || mongoose.model('CookieList', cookieListSchema)
export const CookieChunk = mongoose.models.CookieChunk || mongoose.model('CookieChunk', cookieChunkSchema) 