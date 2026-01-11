// app/api/ai-feedback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    // Sửa: Nhận một object chứa đầy đủ nội dung câu hỏi và đáp án đúng
    const { wrongQuestionsData } = await request.json() 

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ feedback: 'AI bận rồi, ôn tập tiếp nhé!' }, { status: 200 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Tinh chỉnh Prompt: Cung cấp ngữ cảnh chi tiết cho AI
    const prompt = `Bạn là giáo viên Ngữ Văn. Học sinh sai các câu sau:
${wrongQuestionsData.map((q: any, i: number) => 
  `- Câu ${i + 1}: ${q.content}. (Đáp án đúng: ${q.correctAnswer}, Học sinh chọn: ${q.userAnswer})`
).join('\n')}

Dựa trên các lỗi trên, hãy viết 1 câu nhận xét (dưới 30 từ) chỉ rõ lỗ hổng kiến thức và khích lệ học sinh. Không dùng ký tự đặc biệt.`

    const result = await model.generateContent(prompt)
    const feedback = result.response.text().trim()

    return NextResponse.json({ feedback })
  } catch (error) {
    return NextResponse.json({ feedback: 'Tiếp tục cố gắng nhé! 💪' }, { status: 200 })
  }
}