import { createCn } from 'cn/config'

export const cn = createCn({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: ['tiny', 'caption', 'caption-md', 'body', 'subtitle', 'heading', 'logo', 'display'],
        },
      ],
      rounded: [{ rounded: ['mobile', 'media'] }],
    },
  },
})
