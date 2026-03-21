import { NextResponse } from 'next/server'

const CELESTRAK_URL =
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle'

export async function GET() {
  try {
    const res = await fetch(CELESTRAK_URL, {
      headers: {
        'User-Agent': 'SatelliteTracker/1.0',
        'Accept': 'text/plain',
      },
      // Cache for 1 hour
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `CelesTrak returned ${res.status}` },
        { status: res.status }
      )
    }

    const text = await res.text()

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to fetch TLE data: ${message}` },
      { status: 500 }
    )
  }
}
