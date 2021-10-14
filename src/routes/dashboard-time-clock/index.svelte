<script>
  // _imports
  import { browser } from '$app/env';
  import { objectToUrlQueryParams, serverFetch } from '$lib/_helpers';
  import { onMount } from 'svelte';
  import moment from 'moment';
  import initQuestions from '../covid/_lib/questions'

  // components
  import { Button, Card, Keypad, Spinner } from '$components';

  // handlers
  const cancelHandler = () => {
    step = 'init'
    reset();
  }
  const getUsers = async () => {
    const { rows } = await serverFetch(`/api/datatable/users?sort=${JSON.stringify({firstName:1, lastName:1})}`)
    users = rows;
  }
  const initClickHandler = () => {
    modal.spinner.show();
    const matchingEmployee = [...users].filter(user=>user.ennisId === keypad);
    if ( matchingEmployee.length === 1 ) {
      employee = matchingEmployee[0];
      // step = 'takePicture'
      // startWebcam();
      step = 'questions';
    }
    if ( matchingEmployee.length !== 1 ) step = 'incorrectEmployeeId'
    modal.spinner.hide();
  }
  const keepPictureHandler = () => {
    step = 'questions';
  }
  const keypadChangeHandler = e => {
    const { detail : {input}} = e;
    if ( input !== 'del' && keypad.length < 6 ) keypad = keypad + input.toString()
    if ( input === 'del' ) keypad = keypad.length > 0 ? keypad.substring(0, keypad.length - 1 ) : keypad
  }
  const questionClickHandler = value => {
    questions[questionIndex].value = value;
    if ( questionIndex < questions.length ) questionIndex = questionIndex + 1;
    if ( questionIndex === questions.length ) {
      if ( approved ) step = 'approved';
      if ( !approved ) step = 'unapproved';
      submitDailyQuestionnaire();
    }
  }
  const reset = () => {
    employee = {};
    keypad = '';
    questions = questions.map(question=>{
      question.value = undefined;
      return question;
    })
    questionIndex = 0;
    src = '';
  }
  const retakePictureHandler = () => {
    step = 'takePicture'
    startWebcam();
  }
  const startWebcam = () => {
    if ( browser ) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
        navigator.mediaDevices.getUserMedia({video:true, audio:false})
          .then(function(stream) {
            video.srcObject = stream;
            video.play();
          })
          .catch(function(err) {
          })
      } else {
        const keys = [];
        for ( let i in navigator ) {
          keys.push(i);
        }
      }
    }
  }
  const submitDailyQuestionnaire = async () => {
    // initiate variables
    const date = moment().startOf('day').format('x')
    const userId = employee._id;
    const query = {
      date,
      userId
    }

    // check for existing questionnaire
    const {rows} = await serverFetch(`/api/datatable/covid-daily-questionnaire?${objectToUrlQueryParams(query)}`)
    
    // initiate variables
    let method, href;

    // patch if previous questionnaire exists
    if ( rows.length === 1 ) {
      method = 'PATCH';
      href = `/api/covid/daily-questionnaire?_id=${rows[0]._id}`;
    }

    // post if new questionnaire
    if ( rows.length !== 1 ) {
      method = 'POST',
      href = '/api/covid/daily-questionnaire'
    }
    
    // initiate body
    const body = {
      approved,
      date,
      questions,
      userId
    }

    // check for image
    if ( src !== '' && src !== 'data:,' ) body.image = src;

    // perform database upload
    await serverFetch({
      method,
      href,
      body
    })
    
    reset();
  }
  const takePictureHandler = () => {
    height = video.videoHeight;
    width = video.videoWidth;
    const context = canvas.getContext('2d');
    canvas.height = height;
    canvas.width = width;
    context.drawImage(video, 0, 0, width,height);
    src = canvas.toDataURL('image/png');
    step = 'showPicture';
    src = src;
  }

  // props ( internal )
  let canvas;
  let employee = {};
  let height = 0;
  let keypad = "";
  let loaded = false;
  let photo;
  let questions = initQuestions;
  let questionIndex = 0;
  let src = '';
  let step = 'init';
  let users = [];
  let video;
  let width = 0;

  // props ( dynamic )
  $: approved = [...questions].filter(({value}) => value === true).length === 0;
  $: employeeName = 'firstName' in employee ? `${employee.firstName} ${employee.lastName}` : '';

  // stores
  import { modal } from '$stores'

  // lifecycle
  onMount(async() => {
    await getUsers();
    startWebcam();
    loaded = true;
  })
</script>

<svelte:head>
  <title>Dashboard - Employee Online Portal - Allen-Bailey Tag & Label</title>
</svelte:head>

<div class="w-full h-full min-h-screen flex p-[1rem] justify-center">
  {#if loaded}
    {#if step === 'init'}
      <div class="flex-grow flex items-center justify-center">
        <Card class="flex flex-col space-y-[2rem] items-center">
          <div class="text-[1.5rem]">Please enter your 6 digit employee id below</div>
          <div class="text-[1.5rem] h-[3.625rem] rounded ring ring-1 ring-gray-400 px-[22px] py-[11px] text-center w-full">{keypad}</div>
          <Keypad on:click={keypadChangeHandler}/>
          <Button on:click={initClickHandler} textSize="text-[1.5rem]" class="transform {keypad.length === 6 ? 'scale-[1]' : 'scale-[0]'}">Continue</Button>
        </Card>
      </div>
    {:else if step === 'incorrectEmployeeId'}
      <div class="flex-grow flex flex-col space-y-[2rem] px-[4rem] items-center justify-center bg-red-500">
        <div class="text-[3rem] text-gray-800 text-center">Employee ID not found.  Please try again.</div>
        <Button on:click={cancelHandler} theme="outline" textSize="text-[1.5rem]" ring="ring ring-gray-800" textColor="text-gray-800">Try Again</Button>
      </div>
    {:else if step === 'takePicture'}
      <div class="flex-grow flex items-center justify-center">
        <Card class="flex flex-col space-y-[2rem] items-center">
          <div class="text-[1.5rem]">{employeeName}</div>
          <video bind:this={video}>Video stream not available</video>
          <canvas class="fixed" bind:this={canvas}></canvas>
          <div class="flex space-x-[2rem]">
            <Button on:click={cancelHandler} theme="error" textSize="text-[1.5rem]">Cancel</Button>
            <Button on:click={takePictureHandler} textSize="text-[1.5rem]">Take Picture</Button>
          </div>
        </Card>
      </div>
    {:else if step === 'showPicture'}
      <div class="flex-grow flex items-center justify-center">
        <Card class="flex flex-col space-y-[2rem] items-center">
          <img bind:this={photo} {src} alt="Photo" />
          <div class="flex space-x-[2rem]">
            <Button on:click={retakePictureHandler} theme="error" textSize="text-[1.5rem]">Retake Picture</Button>
            <Button on:click={keepPictureHandler} textSize="text-[1.5rem]">Keep Picture</Button>
          </div>
        </Card>
      </div>
    {:else if step === 'questions' }
      <div class="flex-grow flex items-center justify-center">
        <Card class="flex flex-col space-y-[2rem] items-center">
          {#each questions as question, i}
            {#if i === questionIndex}
              <div class="text-[1.5rem]">{question.question}</div>
              <div class="flex space-x-[2rem]">
                <Button on:click={()=>questionClickHandler(false)} textSize="text-[1.5rem]">No</Button>
                <Button on:click={()=>questionClickHandler(true)} textSize="text-[1.5rem]">Yes</Button>
              </div>
            {/if}
          {/each}
        </Card>
      </div>
    {:else if step === 'approved'}
      <div class="flex-grow flex flex-col space-y-[2rem] px-[4rem] items-center justify-center bg-green-500">
        <div class="text-[3rem] text-gray-800">Approved for work</div>
        <Button on:click={cancelHandler} theme="outline" textSize="text-[1.5rem]" ring="ring ring-gray-800" textColor="text-gray-800">Finished</Button>
      </div>
    {:else if step === 'unapproved'}
      <div class="flex-grow flex flex-col space-y-[2rem] px-[4rem] items-center justify-center bg-red-500">
        <div class="text-[3rem] text-gray-800 text-center">Unapproved for work<br>Please leave the premises immediately and contact your immediate supervisor or HR.</div>
        <Button on:click={cancelHandler} theme="outline" textSize="text-[1.5rem]" ring="ring ring-gray-800" textColor="text-gray-800">Finished</Button>
      </div>
    {/if}
  {:else}
    <Card class="self-center">
      <Spinner />
    </Card>
  {/if}
</div>