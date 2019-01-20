# Animator
Animation tool for Minecraft: Java Edition. Utilises functions and armor stands to create complex animated scenes. It can animate single objects and characters aswell as the camera, custom commands and sound effects.

Animator is build on top of Blockbench 1.7.0 with Three.js, Vue.js and other libraries. You can contribute to the development or work on your own fork for your projects. I apologize for the partly messy code, the project was build with a deadline and I didn't have a lot of experience with coding back then.

Download: [Latest Releases](https://github.com/JannisX11/animator/releases/latest)

# How To Use

## Setting Up
To get a reference of the world where you animation is going to take place, you can import structure files. Use the Background menu to add and position backgrounds. Use Set Corner Position to enter the corner coordinates of the structure in your Minecraft world. This will later be used to calculate the starting position of the scene.

To set up a character, click on the Add Character button on the left sidebar. In the outliner below, you can browse all the elements that are in the scene. Each character has a set of bones.

To equip a bone with a model, you can import an item in the right sidebar. For each item you need to enter the ID aswell as the damage value. Below, you can import a model file. Items can be equipped, switched and hidden during the animation with keyframes. Click the big bar next to the item entry to equip the item.

## Animating
Each rig and each bone can be animated in position and rotation. Select the rig or bone, choose the position or rotation tool above the timeline and use the gizmo to transform it. This will automatically create a new keyframe in the timeline. Right click the keyframe to change the interpolation mode or delete it.

Besides rigs, you can also animate the camera. To do this, select the camera and enable Lock Camera To View above the timeline. Then just move the camera.

You can also add custom commands or sound effects. Click "Add Framedata", then add a keyframe to add commands or sound files.

## Export
Go to File > Export Functions to generate your function files. 
