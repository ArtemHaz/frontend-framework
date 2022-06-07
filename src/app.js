import { patch, createVNodeFull, createVNode } from "./vdom.js";
import TasksStore from "./TasksStore/index.js";
import SubjectsStore from "./SubjectsStore/index.js";
import {
  createRef,
  effectWrapper,
  componentEffects,
  setAppRoot,
  renderComponent,
  createState,
  mountEffect,
  memoize,
} from "./effect.js";
import Router from "./router.js";
import Request from "./network.js";
import {registrate, swCacheStrategies} from "./service-worker.js";

const MAIN_PAGE = 'mainPage';
const ABOUT_PAGE = 'aboutPage';

const Header = ({pageName}) => {
  return (
    <header class="header">
      <div class="header__buttonGroup">
        <p id="mainButton"
           class={`header__button header__mainButton ${pageName === MAIN_PAGE ? 'header__mainButton--active' : 'header__animatedButton'}`}
           onclick={() => Router.redirectTo('/')}
        >APP</p>
        <p id="aboutButton"
           class={`header__button header__minorButton ${pageName === ABOUT_PAGE ? 'header__minorButton--active' : 'header__animatedButton'}`}
           onclick={() => Router.redirectTo('/about')}
        >about</p>
      </div>
    </header>
  );
};

const CreateList = effectWrapper(() => {
  mountEffect(() => {
    if (isFirstLoad) {
      isFirstLoad = false;
      SubjectsStore.dispatch('setState');
      TasksStore.dispatch('setState');
      SubjectsStore.dispatch('setTime');
    }
  });

  const listRef = createRef('listComponent');
  TasksStore.subscribe(() => {patch(listRef.current, CreateList())});
  SubjectsStore.subscribe(() => {patch(listRef.current, CreateList())});
  const searchParamsString = Router.getSearchParams();
  let subject = [];
  let description = '';
  let listType = 'subjects';
  let subjectId = -1;
  if (searchParamsString.includes('subject_id')) {
    listType = 'lessons';
    subjectId = +searchParamsString.split('=')[1] ?? 0;
  }
  if (listType === 'subjects') {
    description = SubjectsStore.state.description;
    subject = SubjectsStore.state;
  } else {
    description = TasksStore.state.subjects[subjectId]?.subjectName;
    subject = TasksStore.state.subjects[subjectId];
  }

  return (
    <div class='mainContainer'ref={listRef}>
      <Header pageName={MAIN_PAGE}/>
      <List subject={subject} description={description}  listType={listType}/>
    </div>
  );
});

const CreateAbout = () => {
  return (
    <div class='mainContainer'>
      <Header pageName={ABOUT_PAGE}/>
      <div class="about__text">Приложение для ведения учета домашних заданий в МФ МГТУ</div>
    </div>
  );
};

const getTimeDifferance = memoize((taskTime, realTime) => {
  const taskDate = new Date(taskTime);
  const realDate = new Date(realTime);
  const diffTime = Math.abs(taskDate - realDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
});

const List = effectWrapper(({subject, description, listType = 'subjects'}) => {
  const listRef = createRef('list');
  const formRef = createRef('form');
  const ref1 = createRef('description');
  const ref2 = createRef('day');
  const ref3 = createRef('month');
  const [isNewTaskFormOpen, setIsNewTaskFormOpen] = createState(listRef, false);
  console.log('isNewTaskFormOpen', isNewTaskFormOpen)
  const filteredList = (subject?.items || []).sort((todo1, todo2) => {
    if (todo1.isDone !== todo2.isDone) {
      return +!todo2.isDone - +!todo1.isDone;
    } else {
      return new Date(todo1.date).getTime() - new Date(todo2.date).getTime();
    }
  });

  return (
    <div class="todo" ref={listRef}>
      <h2 class="todo__description">{`${description} ${listType !== 'subjects' ? '(задач осталось: ' + TasksStore.state?.subjects[subject?.subjectId ?? 0]?.items?.length + ')' : ''}`}</h2>
      <ul class="list">
        {filteredList.map((listElement, idx) => {
          const listElementContent = (
              <p
                className={`list__elementTask ${listElement.isDone ? 'list__elementTask--done' : ''}`}
              >
                {listElement.name}
              </p>
            );
          const needRenderTime = listType !== 'subjects' && !listElement.isDone;

          return (
            <li class="list__element">
              <span class="list__elementContent">
                {listType !== 'subjects' ?
                  (<div class="list__checkbox">
                    <input class="list__checkboxInput" type="checkbox" id={`checkbox_${idx}`} name={`checkbox_${idx}`}
                           checked={listElement.isDone} onchange={(evt) => {
                      console.log('chanhe!!!!!!')
                      TasksStore.dispatch('changeTaskStatus', {subjectId: subject.subjectId, taskId: idx});
                    }}/>
                      <label htmlFor={`checkbox_${idx}`}>{listType === 'subjects' ? (<a class="list__link" href={`/?subject_id=${listElement.id}`}>{listElementContent}</a>) : listElementContent}</label>
                  </div>) :
                  <span>{listType === 'subjects' ? (<a className="list__link" href={`/?subject_id=${listElement.id}`}>{listElementContent}</a>) : listElementContent}</span>}
                {needRenderTime ?
                  <div class="list__days">{getTimeDifferance(listElement.date, SubjectsStore.state.time) + 'дн.'}</div> : ''
                }
                <button class="list__deleteButton" onclick={() => {
                  if (listType === 'subjects') {
                    SubjectsStore.dispatch('clearItem', idx);
                    TasksStore.dispatch('clearSubject', idx);
                  } else {
                    TasksStore.dispatch('clearItem', {subjectId: subject.subjectId, index: idx});
                  }
                }}>Удалить</button>
              </span>
            </li>
          );
        })}
      </ul>
      {isNewTaskFormOpen ? (<div class="todo__form" ref={formRef}>
        <label class="todo__text">Название:</label>
        <input class="todo__input" ref={ref1}/>
        <label class="todo__text" class={listType === 'subjects' ? `list__form--disabled` : 'todo__text'}>День:</label>
        <input class={listType === 'subjects' ? `list__form--disabled` : 'todo__input'} ref={ref2}/>
        <label class={listType === 'subjects' ? `list__form--disabled` : 'todo__text'}>Месяц:</label>
        <input class={listType === 'subjects' ? `list__form--disabled` : 'todo__input'} ref={ref3}/>
        <button class="todo__button" onclick={() => {
          if (listType !== 'subjects') {
            const date = new Date;
            TasksStore.dispatch('addItem', {
              subjectId: subject.subjectId,
              name: ref1.current.value,
              date: new Date(`${date.getFullYear()}-${ref3.current.value.length < 2 ? '0' + ref3.current.value : ref3.current.value}-${ref2.current.value.length < 2 ? '0' + ref2.current.value : ref2.current.value}T01:00:00`),
            });
          } else {
            const validId = Object.keys(TasksStore.state.subjects).length + 1;
            const name = ref1.current.value;
            SubjectsStore.dispatch('addItem', {name: name, id: validId});
            TasksStore.dispatch('addSubject', {name: name, id: validId});
          }

          ref1.current.value = '';
          ref2.current.value = '';
          ref3.current.value = '';
          setIsNewTaskFormOpen(false);
        }}>ADD</button>
        <button class="todo__button" onclick={() => {
          ref1.current.value = '';
          setIsNewTaskFormOpen(false);
        }}>CANCEL
        </button>
      </div>) : ''}
      {!isNewTaskFormOpen ? <button class="todo__button" onclick={() => {
        setIsNewTaskFormOpen(true);
      }}>+</button> : ''}
    </div>
  );
});


let isFirstLoad = true;

const appEl = document.getElementById("app");
setAppRoot(appEl);

Router.start();
Router.append('/', () => renderComponent(CreateList()));
Router.append('/about', () => renderComponent(CreateAbout()));
Router.setErrorComponent(() => renderComponent(createVAppError()))

// registrate(swCacheStrategies.NETWORK_FIRST_SW_TYPE);
