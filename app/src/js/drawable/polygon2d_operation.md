# Operation

## Create a new label

1. Click
   1. **Label_list**.***onMouseDown***
      1. set **highlighted** and **selected** to null
      2. create **selectedLabel** = Function ***makeDrawableLabel***
      3. Call Function **selectedLabel**.***initTemp***
         - Initialize the polygon label
      4. Call Function **selectedLabel**.***onMouseDown***
         - **label.mouseDown** = true
   2. **Label_list**.***onMouseUp***
      1. call Function **selectedLabel**.***onMouseUp***
         1. Call function **selectedLabel**.***newVertex***
            - add a vertex to the polygon
      2. Call Function **selectedLabel**.***commitLabel***
         - not commit label
2. Move
   - **Label_list**.***onMouseMove***
     - Call function **selectedLabel**.***onMouseMove***
       - add the vertex to make a temporary polygon
3. Click
   1. **Label_list**.***onMouseDown***
      - Call Function **selectedLabel**.***onMouseDown***
        - **selectedLabel.mouseDown** = true
   2. **Label_list**.***onMouseUp***
      1. call Function **selectedLabel**.***onMouseUp***
         1. Judge whether it is closed
         2. Call function **selectedLabel**.***newVertex***
            - add a vertex to the polygon
      2. Call Function **selectedLabel**.***commitLabel***
         - not commit label
4. ....
5. Click until closed
   - Call Function **selectedLabel**.***commitLabel***
     - commit label

## Drag

1. **Label_list**.***onMouseDown***
   1. set **highlighted** and **selected** to null
   2. call **selectedLabel**.***setSelected***
   3. Editing = true
   4. Call Function **selectedLabel**.***onMouseDown***
2. **Label_list**.***onMouseMove***
   - call function **selectedLabel**.***onMouseMove***
     - If **selectedHandle** is a point
       - call  function ***reshape***
     - if selectedHandle is 0
       - call function ***move***
3. **Label_list**.***onMouseUp***
   - call Function **selectedLabel**.***onMouseUp***
   - call Function **selectedLabel**.***commitLabel***

## No selected Move

- **Label_list**.***onMouseMove***
  - Reset the highlighted label
