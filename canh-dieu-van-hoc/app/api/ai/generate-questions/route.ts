import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI service chưa được cấu hình API Key' }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
    
    const finalPrompt = `
    Bạn là một giáo viên xuất sắc, cẩn thận của bộ môn Ngữ Văn lớp 12 đang dạy chuyên nghiệp chương trình sách giáo khoa Cánh Diều.
      Nhiệm vụ: ${prompt}
      Yêu cầu nghiêm ngặt: Trả về định dạng JSON là một mảng các đối tượng (không kèm markdown, không kèm giải thích ngoài JSON).
      Cấu trúc mỗi đối tượng:
      {
        "content": "Nội dung câu hỏi",
        "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
        "correct": "Nội dung đáp án đúng (phải khớp y hệt 1 trong 4 options trên)",
        "work_title": "Tên tác phẩm chính xác nhất",
        "difficulty": "Dễ" hoặc "Trung bình" hoặc "Khó",
        "explanation": "Giải thích tại sao chọn đáp án đó"
      }
    `

    const result = await model.generateContent(finalPrompt)
    const responseText = result.response.text()
    
    // Làm sạch chuỗi JSON để tránh lỗi parse
    const cleanJson = responseText.replace(/```json|```/g, '').trim()
    const questions = JSON.parse(cleanJson)

    return NextResponse.json({ success: true, questions })
  } catch (error: any) {
    console.error("AI Route Error:", error)
    return NextResponse.json({ error: "AI không thể tạo câu hỏi lúc này: " + error.message }, { status: 500 })
  }
}