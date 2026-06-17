/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const ownerRule = 'user = @request.auth.id'
    const viaConversationRule = 'conversation.user = @request.auth.id'

    const conversations = new Collection({
      name: 'conversations',
      type: 'base',
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: ownerRule,
      updateRule: ownerRule,
      deleteRule: ownerRule,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: false
        },
        {
          name: 'user',
          type: 'relation',
          required: true,
          maxSelect: 1,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true
        }
      ]
    })

    app.save(conversations)

    const messages = new Collection({
      name: 'messages',
      type: 'base',
      listRule: viaConversationRule,
      viewRule: viaConversationRule,
      createRule: viaConversationRule,
      updateRule: viaConversationRule,
      deleteRule: viaConversationRule,
      fields: [
        {
          name: 'conversation',
          type: 'relation',
          required: true,
          maxSelect: 1,
          collectionId: conversations.id,
          cascadeDelete: true
        },
        {
          name: 'role',
          type: 'text',
          required: true
        },
        {
          name: 'content',
          type: 'text',
          required: false
        }
      ]
    })

    app.save(messages)
  },
  (app) => {
    const messages = app.findCollectionByNameOrId('messages')
    app.delete(messages)

    const conversations = app.findCollectionByNameOrId('conversations')
    app.delete(conversations)
  }
)
