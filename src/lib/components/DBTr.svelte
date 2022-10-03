<script>
  import { Checkbox, ContextMenu, Tr } from '$components';

  // handlers
  const highlightCellHandler = () => {
    const methods = [
      contextmenu.cell.highlight ? 'remove' : 'add',
      contextmenu.cell.highlight ? 'add' : 'remove'
    ];
    contextmenu.cell.elem.classList[methods[1]](
      'even:bg-primary-500/[.1]',
      'hover:bg-primary-500/[.4]',
      'odd:bg-primary-500/[.2]'
    );
  };
  const highlightRowHandler = () => {
    const methods = [
      contextmenu.row.highlight ? 'remove' : 'add',
      contextmenu.row.highlight ? 'add' : 'remove'
    ];
    contextmenu.row.elem.classList[methods[0]](
      'dark:even:bg-black/[.2]',
      'dark:hover:bg-white/[.05]',
      'dark:odd:bg-black/[.4]',
      'even:bg-gray-50',
      'hover:bg-white/[.1]',
      'odd:bg-gray-100'
    );
    contextmenu.row.elem.classList[methods[1]](
      'even:bg-primary-500/[.1]',
      'hover:bg-primary-500/[.4]',
      'odd:bg-primary-500/[.2]'
    );
  };

  // props (internal
  let contextmenu = {
    cell: {
      elem: undefined,
      highlight: false
    },
    handler: undefined,
    row: {
      elem: undefined,
      highlight: false
    }
  };
</script>

<Tr
  on:contextmenu={(e) => {
    contextmenu.cell.elem = e.target.nodeName === 'td' ? e.target : e.target.closest('td');
    contextmenu.cell.highlight = contextmenu.cell.elem.classList.contains(
      'even:bg-primary-500/[.1]'
    );
    contextmenu.row.elem = e.target.closest('tr');
    contextmenu.row.highlight = contextmenu.row.elem.classList.contains('even:bg-primary-500/[.1]');
    contextmenu.handler(e);
  }}
>
  <slot />
</Tr>

<ContextMenu bind:contextmenuHandler={contextmenu.handler} class="space-y-[1rem]">
  <Checkbox
    bind:checked={contextmenu.cell.highlight}
    class="mr-[.5rem]"
    on:change={highlightCellHandler}
  >
    Highlight Cell
  </Checkbox>
  <Checkbox
    bind:checked={contextmenu.row.highlight}
    class="mr-[.5rem]"
    on:change={highlightRowHandler}
  >
    Highlight Row
  </Checkbox>
</ContextMenu>
