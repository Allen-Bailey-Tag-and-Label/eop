<script lang="ts">
import { H1, H3 } from '$components';

// props (external)
export let data;
</script>

<H3>Hi {data.user.profile?.firstName}</H3>
<H1>Welcome Back</H1>
