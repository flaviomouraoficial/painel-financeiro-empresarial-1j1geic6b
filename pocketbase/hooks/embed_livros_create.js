onRecordAfterCreateSuccess((e) => {
  const title = e.record.getString('titulo') || ''
  const desc = e.record.getString('descricao') || ''
  let keywords = e.record.get('palavras_chave')
  if (!keywords) keywords = []
  else if (!Array.isArray(keywords)) keywords = [keywords]

  const text = (title + '\n\n' + desc + '\n\n' + keywords.join(', ')).trim()

  if (!text) return e.next()

  const apiKey = $secrets.get('OPENAI_API_KEY')
  if (!apiKey) {
    console.log('Missing OPENAI_API_KEY for embedding livros')
    return e.next()
  }

  const res = $http.send({
    url: 'https://api.openai.com/v1/embeddings',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
    timeout: 30,
  })

  if (res.statusCode !== 200) {
    console.log('embedding failed for record ' + e.record.id, res.raw || JSON.stringify(res.json))
    return e.next()
  }

  const record = $app.findRecordById('livros', e.record.id)
  record.set('embedding', res.json.data[0].embedding)
  $app.save(record)
  return e.next()
}, 'livros')
