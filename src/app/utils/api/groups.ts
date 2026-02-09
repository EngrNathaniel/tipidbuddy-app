export async function createSavingsGroup(
  name: string,
  dailyGoal: number,
  accessToken: string
) {
  const response = await fetch(
    'https://cchayicghnuxlkiipgxv.supabase.co',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name,
        dailyGoal,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create group')
  }

  return data.group
}
