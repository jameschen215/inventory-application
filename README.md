# Project: Inventory Application

## Refactor ejs files

- admin page done
- book form done
- author form done
- author details done
- book details done
- books done
- confirm deletion done

- error page done
- genres page done
- languages page done

- edit-form

## What I've learned

### How to prevent the tab key from moving focus to elements behind a modal

Using the inert attribute (Modern approach)

Add the inert attribute to the main content when the modal is open:

```html
<!-- When modal is open, add inert to main content -->
<main inert>
  <!-- Page content that should not be focusable -->
</main>

<div class="modal">
  <!-- Modal content remains focusable -->
</div>
```

```JavaScript
// When opening modal
document.querySelector('main').setAttribute('inert', '');

// When closing modal
document.querySelector('main').removeAttribute('inert');
```
