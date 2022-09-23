<script>
  import { Pwa, Title } from '$components';
  import { theme } from '$stores';
  import { cerulean } from '$themes';
  import '../app.postcss';

  theme.set(cerulean);
</script>

<Pwa themeColor="#242424" />
<Title base="EOP - Allen Bailey Tag & Label" />
<slot />
