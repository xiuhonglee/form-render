import React from 'react';
import { Input, Icon, Popover } from 'antd';
import previewContent from '../../components/previewContent';

const previewNode = (format, value) => {
  if (format !== 'image') {
    return null;
  }
  return (
    <Popover
      content={previewContent(format, value)}
      className="fr-preview"
      placement="bottom"
    >
      <Icon type="picture" />
    </Popover>
  );
};

export default function input(p) {
  const { options = {}, invalid } = p;
  const style = invalid ? { borderColor: '#f5222d' } : {};
  const { format = 'text' } = p.schema;
  const type = format === 'image' ? 'text' : format;
  const handleChange = e => p.onChange(p.name, e.target.value);
  return (
    <Input
      style={style}
      {...options}
      value={p.value}
      type={type}
      disabled={p.disabled || p.readonly}
      addonAfter={
        options.addonAfter ? options.addonAfter : previewNode(format, p.value)
      }
      onChange={handleChange}
    />
  );
}
