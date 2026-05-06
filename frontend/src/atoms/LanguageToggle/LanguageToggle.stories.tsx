import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { LanguageToggle, type Language } from './LanguageToggle';

const meta: Meta<typeof LanguageToggle> = {
  title: 'Atoms/LanguageToggle',
  component: LanguageToggle,
};
export default meta;
type Story = StoryObj<typeof LanguageToggle>;

function Controlled({ initial }: { initial: Language }) {
  const [value, setValue] = useState<Language>(initial);
  return <LanguageToggle value={value} onChange={setValue} />;
}

export const EnglishSelected: Story = {
  render: () => <Controlled initial="en" />,
};

export const SpanishSelected: Story = {
  render: () => <Controlled initial="es" />,
};
