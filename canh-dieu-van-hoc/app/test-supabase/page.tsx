'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestSupabasePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    testQueries()
  }, [])

  const testQueries = async () => {
    const supabase = createClient()

    // Test 1: Questions
    console.log('🔍 Testing questions...')
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('*')
      .eq('is_public', true)
      .limit(5)

    console.log('Questions:', questions)
    console.log('Questions Error:', qError)

    // Test 2: Literary Works
    console.log('🔍 Testing literary_works...')
    const { data: works, error: wError } = await supabase
      .from('literary_works')
      .select('*')
      .limit(5)

    console.log('Works:', works)
    console.log('Works Error:', wError)

    // Test 3: Profiles
    console.log('🔍 Testing profiles...')
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)

    console.log('Profiles:', profiles)
    console.log('Profiles Error:', pError)

    setResult({
      questions: { data: questions, error: qError },
      works: { data: works, error: wError },
      profiles: { data: profiles, error: pError }
    })
    setLoading(false)
  }

  if (loading) {
    return <div className="p-8">Loading tests...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Supabase RLS Test</h1>
      
      {/* Questions Test */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-bold mb-2">Questions Table</h2>
        {result.questions.error ? (
          <div className="text-red-600">
            ❌ Error: {JSON.stringify(result.questions.error, null, 2)}
          </div>
        ) : (
          <div className="text-green-600">
            ✅ Success! Found {result.questions.data?.length || 0} questions
            <pre className="mt-2 text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(result.questions.data, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Works Test */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-bold mb-2">Literary Works Table</h2>
        {result.works.error ? (
          <div className="text-red-600">
            ❌ Error: {JSON.stringify(result.works.error, null, 2)}
          </div>
        ) : (
          <div className="text-green-600">
            ✅ Success! Found {result.works.data?.length || 0} works
          </div>
        )}
      </div>

      {/* Profiles Test */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-bold mb-2">Profiles Table</h2>
        {result.profiles.error ? (
          <div className="text-red-600">
            ❌ Error: {JSON.stringify(result.profiles.error, null, 2)}
          </div>
        ) : (
          <div className="text-green-600">
            ✅ Success! Found {result.profiles.data?.length || 0} profiles
          </div>
        )}
      </div>
    </div>
  )
}