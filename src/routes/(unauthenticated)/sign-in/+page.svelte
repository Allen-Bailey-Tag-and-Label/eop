<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button, Card, Fieldset, Form, H1, Input, InputGroup, Logo } from '$components';
</script>

<div class="flex flex-col items-center space-y-8 p-6">
  <Logo class="w-[4rem] h-[4rem]" />
  <H1 class="px-6">Sign in to your account</H1>
  <Card class="w-full">
    <Form use={[enhance]}>
      <InputGroup>
        <Fieldset legend="Username">
          <Input name="username" required="required" />
        </Fieldset>
        <Fieldset legend="Password">
          <Input name="Password" required="required" type="password" />
        </Fieldset>
      </InputGroup>
      <Button type="submit">Sign In</Button>
    </Form>
  </Card>
</div>
