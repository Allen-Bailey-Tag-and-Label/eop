<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button, Card, Fieldset, Form, H1, Input } from '$components';
</script>

<div class="flex flex-col items-center space-y-8">
  <div>Logo</div>
  <H1>Sign in to your account</H1>
  <Card class="w-full">
    <Form use={[enhance]}>
      <Fieldset legend="Username">
        <Input name="username" required="required" />
      </Fieldset>
      <Fieldset legend="Password">
        <Input name="Password" required="required" type="password" />
      </Fieldset>
      <Button type="submit">Sign In</Button>
    </Form>
  </Card>
</div>
