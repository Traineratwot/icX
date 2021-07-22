# icX

icX is a programming language translated to ic10 used to simplify the programming of ic10 microprocessors in
the Stationeers game.
# Quick start
1. Install [plugin for VSC](https://marketplace.visualstudio.com/items?itemName=Traineratwot.stationeers-ic10)
2. Create a file with **.icX** type
3. Write a program. For example: 
    ```
    use loop
    var on = d1.Open
    d0.On = on
    ```
4. Save the file (Ctrl+S) 
5. Copy a code from a new generated file with the same name and type **.ic10**
6. Paste code into microprocessor Ic10 in the game

# Instructions
### Comments

  ```
  # Text after a # will be ignored to the end of the line
  ```

### Vars

icX will automatically replace variable names with register names
```
---icX
   var a = 10
---ic10
   move r0 10
```

Using _alias_
```
---icX
   use aliases
   var a = 10
---ic10
   alias a r0
   move a 10
```

Using _define_
```
---icX
   use constants
   const PI = 3.14
---ic10
   define PI 3.14
```

### Math
#### Unary operations (++, --)

inc
```
---icX
   var a = 0
   a++
---ic10
   move r0 0
   add r0 r0 1
```

dec
```
---icX
   var a = 0
   a--
---ic10
   move r0 0
   sub r0 r0 1
```

#### Binary operations (+, -, *, /, %)

Constants will be calculated automatically
```
---icX
   var x =  5 + 5 * 2 
---ic10
   move r0 15
```
```
---icX
   const x = 2 + 2
   const y = x + 2
   var z = y + 2
---ic10
   move r0 8
```

Binary operations with variables

```
---icX
   var k = 2
   var y = 5
   var x =  y + y * k
---ic10
   move r0 2
   move r1 5
   mul r15 r1 r0
   add r2 r1 r15
   add r2 r2 5
```

### IF - ELSE

Binary logical operations used (<, >, ==, !=, <=, >=, &, |, ~=)

```
---icX
   var a = 0
   var b = 0
   if a >= 0
     b = 1
   else
     b = 0
   end
---ic10
   move r0 0
   move r1 0
   sgez r15 r0
   beqz r15 if0else
   beq r15 1 if0
   if0:
      move r1 1
      j if0exit
   if0else:
      move r1 0
   if0exit:
```

### While

```
---icX
 var a = 0
 while a >= 10
    a++
 end
---ic10
 move r0 0
 while0:
    sge r15 r0 10
    beqz r15 while0exit
    add r0 r0 1
    j while0
 while0exit:
```

### Devices

```
---icX
 d0.Setting = 1                  # Set device param
 var a = d0.Setting              # Load device param into a register 
 var b = d0.slot(a).PrefabHash   # Using a slot of the device
 a = d(5438547545).Setting(Sum)  # Batch load, where 5438547545 is hash of the device
 d(5438547545).Setting = b       # Batch configuration 
---ic10
 s d0 Setting 1
 l r0 d0 Setting
 ls r1 d0 r0 PrefabHash
 lb r0 5438547545 Setting Sum
 sb 5438547545 Setting r1
```

### Function

To write a function, use the _function_ keyword
```
{function name}()

function {function name}
   {code}
end
```

```
---icX
 use loop
 var a = 0 
 example()
 var on = d1.Open
 d0.On = on
 
 function example
     move a 1
 end
---ic10
 move r0 0
 jal example
 l r1 d1 Open
 s d0 On r1
 j 0
 example:
 move r0 1
 j ra
```

### Use 

In addition to _use aliases_ and _use constant_, the following constructs are supported:

To loop the application, use _use loop_
```
---icX
 move r0 0
 jal example
 l r1 d1 Open
 s d0 On r1
 j 0
 example:
 move r0 1
 j ra
---ic10
 move r0 0
 jal example
 l r1 d1 Open
 s d0 On r1
 j 0
 example:
 move r0 1
 j ra
```

Use _use comments_ to transfer your comments to ic10 code
```
---icX
 use comments
 # Example
 var a = 0
 var on = d1.Open
 # Example
 d0.On = on
 test()
 function test
  var c = 1
 end
---ic10
 # ---icX User code start---
 # Example
 move r0 0
 l r1 d1 Open
 # Example
 s d0 On r1
 jal test
 # ---icX User code end---
 jr 4
 test:
 move r2 1
 j ra
```

### Additional examples of icX code

```
#alias SolarSensor d0
#alias SolarPanel d1
#alias LedVertical d2
#alias LedHorizontal d3
var SOLAR_HASH = d1.PrefabHash

var verical = 180
var horizontal = 180

main:
    updateLED()
    setSolarPanels()
    yield
j main

function setSolarPanels
    d(SOLAR_HASH).Vertical = verical
    d(SOLAR_HASH).Horizontal = horizontal
end

function updateLED
    d2.Setting = verical
    d3.Setting = horizontal
end
```