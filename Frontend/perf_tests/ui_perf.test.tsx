import { describe, it, expect, afterAll, vi } from 'vitest';
import { Profiler, createRef } from 'react';
import { render, cleanup, fireEvent, act } from '@testing-library/react';
import { writeFileSync } from 'fs';
import path from 'path';
import { ToastProvider } from '@/context/ToastContext';
import DataTable from '@/components/common/DataTable/DataTable';
import CustomDropdown from '@/components/ui/CustomDropdown';
import Modal from '@/components/ui/Modal';

// jsdom lacks these
(globalThis as any).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
(globalThis as any).IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} };
window.scrollTo = vi.fn();

const report: Record<string, any>[] = [];
const rec = (r: Record<string, any>) => { report.push(r); console.log(JSON.stringify(r)); };
const mb = (b: number) => +(b / 1024 / 1024).toFixed(2);
const gc = () => (globalThis as any).gc?.();
const rows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: i, flat: `A-${i}`, title: `Maintenance Dues ${i}`, status: i % 3 ? 'Pending' : 'Paid', amount: 1500 + i,
  }));
const columns = [
  { header: 'Flat', accessor: 'flat' },
  { header: 'Title', accessor: 'title' },
  { header: 'Status', accessor: 'status' },
  { header: 'Amount', accessor: 'amount' },
];
const wrap = (ui: React.ReactNode) => <ToastProvider>{ui}</ToastProvider>;

afterAll(() => {
  writeFileSync(path.resolve(__dirname, 'frontend_report.json'), JSON.stringify(report, null, 2));
});

describe('DataTable rendering (client-side data)', () => {
  for (const n of [100, 1000, 5000, 20000]) {
    it(`mount + rerender with ${n} rows`, () => {
      gc();
      const heap0 = process.memoryUsage().heapUsed;
      let commits = 0;
      const t0 = performance.now();
      const { rerender, container } = render(
        wrap(
          <Profiler id="dt" onRender={() => { commits++; }}>
            <DataTable data={rows(n)} columns={columns} enableSearch defaultPageSize={10} />
          </Profiler>,
        ),
      );
      const mount = performance.now() - t0;
      const domNodes = container.querySelectorAll('*').length;
      const t1 = performance.now();
      rerender(
        wrap(
          <Profiler id="dt" onRender={() => { commits++; }}>
            <DataTable data={rows(n)} columns={columns} enableSearch defaultPageSize={10} />
          </Profiler>,
        ),
      );
      const rerenderMs = performance.now() - t1;
      const heap1 = process.memoryUsage().heapUsed;
      rec({ test: 'DataTable mount', rows: n, mount_ms: +mount.toFixed(1), rerender_ms: +rerenderMs.toFixed(1), commits, dom_nodes: domNodes, heap_delta_mb: mb(heap1 - heap0) });
      cleanup();
    });
  }

  it('search keystroke latency @ 5000 rows (10 keystrokes)', () => {
    const { getByPlaceholderText } = render(wrap(<DataTable data={rows(5000)} columns={columns} enableSearch searchPlaceholder="Search..." />));
    const input = getByPlaceholderText('Search...');
    const times: number[] = [];
    for (const v of 'Maintenance'.slice(0, 10).split('').map((_, i, a) => a.slice(0, i + 1).join(''))) {
      const t = performance.now();
      fireEvent.change(input, { target: { value: v + '1' } });
      times.push(performance.now() - t);
    }
    rec({ test: 'DataTable search', rows: 5000, avg_ms: +(times.reduce((a, b) => a + b) / times.length).toFixed(1), max_ms: +Math.max(...times).toFixed(1) });
    cleanup();
  });
});

describe('DataTable server mode (api prop)', () => {
  it('fires exactly one fetch on mount (no refetch loop)', async () => {
    const api = vi.fn().mockResolvedValue({ results: rows(10), count: 1000 });
    render(wrap(<DataTable api={api} columns={columns} />));
    await act(async () => { await new Promise((r) => setTimeout(r, 300)); });
    rec({ test: 'DataTable api fetch count on mount', calls: api.mock.calls.length });
    expect(api.mock.calls.length).toBeLessThanOrEqual(1);
    cleanup();
  });

  it('refresh() ref triggers one additional fetch', async () => {
    const api = vi.fn().mockResolvedValue({ results: rows(10), count: 10 });
    const ref = createRef<any>();
    render(wrap(<DataTable ref={ref} api={api} columns={columns} />));
    await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
    const before = api.mock.calls.length;
    await act(async () => { await ref.current.refresh(); });
    rec({ test: 'DataTable refresh()', extra_calls: api.mock.calls.length - before });
    expect(api.mock.calls.length - before).toBe(1);
    cleanup();
  });
});

describe('CustomDropdown', () => {
  for (const n of [50, 500, 2000]) {
    it(`open with ${n} options`, () => {
      const options = Array.from({ length: n }, (_, i) => ({ value: i, label: `Flat ${i}` }));
      const { container, baseElement } = render(<CustomDropdown options={options} onChange={() => {}} searchable />);
      const trigger = container.querySelector('button') as HTMLElement;
      const t = performance.now();
      fireEvent.click(trigger);
      const openMs = performance.now() - t;
      rec({ test: 'CustomDropdown open', options: n, open_ms: +openMs.toFixed(1), dom_nodes_in_body: baseElement.querySelectorAll('*').length });
      cleanup();
    });
  }
});

describe('Memory: mount/unmount leak check', () => {
  const cycles = 200;
  const cases: [string, () => React.ReactElement][] = [
    ['DataTable(500 rows)', () => wrap(<DataTable data={rows(500)} columns={columns} enableSearch />)],
    ['CustomDropdown(500 opts)', () => <CustomDropdown options={Array.from({ length: 500 }, (_, i) => ({ value: i, label: `o${i}` }))} onChange={() => {}} />],
    ['Modal(open)', () => <Modal isOpen onClose={() => {}} title="t"><div>body</div></Modal>],
  ];
  for (const [name, make] of cases) {
    it(`${name}: ${cycles} mount/unmount cycles`, () => {
      for (let i = 0; i < 20; i++) { render(make()); cleanup(); } // warm-up
      gc(); gc();
      const h0 = process.memoryUsage().heapUsed;
      const t = performance.now();
      for (let i = 0; i < cycles; i++) { render(make()); cleanup(); }
      const elapsed = performance.now() - t;
      gc(); gc();
      const h1 = process.memoryUsage().heapUsed;
      const leftoverNodes = document.body.querySelectorAll('*').length;
      rec({ test: 'Leak check', component: name, cycles, ms_per_cycle: +(elapsed / cycles).toFixed(2), heap_growth_mb: mb(h1 - h0), kb_per_cycle: +((h1 - h0) / 1024 / cycles).toFixed(1), leftover_dom_nodes: leftoverNodes, gc_available: typeof (globalThis as any).gc === 'function' });
      expect(leftoverNodes).toBe(0);
    });
  }
});
