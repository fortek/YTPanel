import mongoose from 'mongoose'

const cookieSchema = new mongoose.Schema({
  email: { type: String, required: true },
  cookie: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
})

const cookieListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cookies: [cookieSchema],
  cleanCookies: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

export const CookieList = mongoose.models.CookieList || mongoose.model('CookieList', cookieListSchema) 