import type { Preview } from '@storybook/react';
import { I18nextProvider } from 'react-i18next';
import { createElement, type ReactNode } from 'react';

import '../src/styles/tokens.css';
import '../src/styles/reset.css';
import i18n from '../src/i18n';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'app',
      values: [
        { name: 'app', value: '#ffffff' },
        { name: 'subtle', value: '#f1f5f9' },
      ],
    },
  },
  decorators: [
    (Story) =>
      createElement(
        I18nextProvider,
        { i18n },
        createElement(Story) as ReactNode,
      ),
  ],
};

export default preview;
