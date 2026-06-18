/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('messages')

    collection.fields.add(
      new NumberField({
        name: 'sequence',
        required: false
      })
    )

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('messages')
    collection.fields.removeByName('sequence')
    app.save(collection)
  }
)
