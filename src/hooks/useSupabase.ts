import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Tables = Database['public']['Tables']

// Custom hook for fetching data from Supabase
export function useSupabaseQuery<T extends keyof Tables>(
  table: T,
  options?: {
    select?: string
    filter?: Record<string, any>
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
  }
) {
  const [data, setData] = useState<Tables[T]['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        let query = supabase.from(table).select(options?.select || '*')

        // Apply filters
        if (options?.filter) {
          Object.entries(options.filter).forEach(([key, value]) => {
            query = query.eq(key, value)
          })
        }

        // Apply ordering
        if (options?.orderBy) {
          query = query.order(options.orderBy.column, {
            ascending: options.orderBy.ascending ?? true
          })
        }

        // Apply limit
        if (options?.limit) {
          query = query.limit(options.limit)
        }

        const { data: result, error: queryError } = await query

        if (queryError) {
          throw queryError
        }

        setData(result || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [table, JSON.stringify(options)])

  return { data, loading, error, refetch: () => fetchData() }
}

// Hook for real-time subscriptions
export function useSupabaseSubscription<T extends keyof Tables>(
  table: T,
  callback: (payload: any) => void,
  filter?: string
) {
  useEffect(() => {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table as string,
          filter: filter
        },
        callback
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, callback, filter])
}

// Hook for authentication state
export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    loading,
    signIn: (email: string, password: string) =>
      supabase.auth.signInWithPassword({ email, password }),
    signUp: (email: string, password: string, metadata?: any) =>
      supabase.auth.signUp({ email, password, options: { data: metadata } }),
    signOut: () => supabase.auth.signOut()
  }
}