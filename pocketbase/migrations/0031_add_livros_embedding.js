migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('livros')
    if (!col.fields.getByName('embedding')) {
      // Workaround for Goja ReferenceError on missing constructor:
      // Create a dummy collection using plain object syntax to instantiate the field, then extract it.
      const dummy = new Collection({
        name: 'dummy_for_field',
        type: 'base',
        fields: [
          {
            name: 'embedding',
            type: 'vector',
            dimensions: 1536,
            distance: 'cosine',
          },
        ],
      })
      col.fields.add(dummy.fields.getByName('embedding'))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('livros')
    if (col.fields.getByName('embedding')) {
      col.fields.removeByName('embedding')
      app.save(col)
    }
  },
)
