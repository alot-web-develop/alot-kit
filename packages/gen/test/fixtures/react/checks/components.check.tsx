import type { UseQueryResult } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { DataTable } from '@/components/DataTable';
import { ListPagination } from '@/components/ListPagination';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Form, FormInput, useZodForm } from '@/components/form';
import { z } from 'zod';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const result = (state: object) => state as UseQueryResult<string[]>;

test('QueryBoundary renders loading, error, empty and success states', () => {
  const render = (state: object) =>
    renderToStaticMarkup(
      <QueryBoundary query={result(state)} isEmpty={(data) => data.length === 0}>
        {(data) => <span>{data.join(',')}</span>}
      </QueryBoundary>,
    );
  expect(render({ isPending: true, isError: false })).toContain('aria-label="common.loading"');
  expect(render({ isPending: false, isError: true, error: new Error('Boom') })).toContain('Boom');
  expect(render({ isPending: false, isError: false, data: [] })).toContain('common.empty');
  expect(render({ isPending: false, isError: false, data: ['a', 'b'] })).toBe('<span>a,b</span>');
});

test('DataTable renders headers and rows with the ui table primitives', () => {
  const markup = renderToStaticMarkup(
    <DataTable
      data={[{ id: '1', name: 'One' }]}
      columns={[{ id: 'name', header: 'Name', cell: (row) => row.name }]}
      getRowId={(row) => row.id}
    />,
  );
  expect(markup).toContain('data-slot="table"');
  expect(markup).toContain('>Name</th>');
  expect(markup).toContain('>One</td>');
});

test('ListPagination disables the edges of the range', () => {
  const markup = renderToStaticMarkup(<ListPagination page={1} pageSize={10} total={25} onPageChange={() => {}} />);
  expect(markup).toContain('aria-label="pagination"');
  expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>common.previous/);
  expect(markup).not.toMatch(/<button[^>]*disabled=""[^>]*>common.next/);
});

test('Form helpers render labelled inputs wired to react-hook-form', () => {
  const schema = z.object({ name: z.string().min(1) });
  const Sample = () => {
    const form = useZodForm(schema);
    return (
      <Form form={form} onSubmit={() => {}}>
        <FormInput name="name" label="Name" />
      </Form>
    );
  };
  const markup = renderToStaticMarkup(<Sample />);
  expect(markup).toContain('<form noValidate=""');
  expect(markup).toMatch(/<label[^>]*for="[^"]+"[^>]*>Name<\/label>/);
  expect(markup).toMatch(/<input[^>]*name="name"/);
});
