import helloworld from './helloworld';

const str = helloworld();

function element() {
  const div = document.createElement('div');
  div.innerHTML = str;
  return div;
}

document.body.append(element());