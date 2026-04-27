routerAdd(
  'POST',
  '/backend/v1/search/livros',
  (e) => {
    const body = e.requestInfo().body || {}
    const query = (body.query || '').trim()

    if (!query) return e.badRequestError('missing query')

    const apiKey = $secrets.get('OPENAI_API_KEY')
    if (!apiKey) return e.internalServerError('OPENAI_API_KEY not configured')

    const embedRes = $http.send({
      url: 'https://api.openai.com/v1/embeddings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: query }),
      timeout: 30,
    })

    if (embedRes.statusCode !== 200) return e.internalServerError('embedding failed')

    const results = $vectors.search(e, 'livros', {
      field: 'embedding',
      query: embedRes.json.data[0].embedding,
      k: body.k || 20,
      expand: ['usuario_id'],
    })

    return e.json(200, results)
  },
  $apis.requireAuth(),
)
