---
title: Hello Hexagon
categories:
- 部署
tags:
- jidu
- hexagon
- 教程
- 环境配置
---

hexagon是高通Soc的DSP，专有HVX指令集。DSP是并列于CPU，GPU的一类计算单元，有独特的架构，需要单独的工具链。笔者也是第一次接手DSP上的开发工作，本文将从一个新手的角度出发，以实践性为导向，记录如何开始在hexagon的算法部署工作。

<!--more-->

## 0. 资源
[hexagon sdk](https://developer.qualcomm.com/software/hexagon-dsp-sdk): 有时候网页会有问题，报web-error，提供了一个愚蠢的管理工具，而不是直接的sdk，很麻烦，不推荐。  
[tvm unofficial docker image](https://hub.docker.com/u/tlcpack): tvm所有的镜像  
[tvm image for hexagon](https://hub.docker.com/r/tlcpack/ci-hexagon/tags): tvm用于hexagon的镜像，推荐使用这个镜像，而不是自己build，tvm提供的Dockerfile有bug，无法正常build且需要编译llvm for hexagon/x86，需要非常久的时间。

## 1. 预热

### 1.1 **DSP(Digital Signal Processor)**

即数字信号处理器，是低频，但高并行度的计算单元，适合用于部署音频及图像处理任务。DSP相较于CPU/GPU，特点是强调定点计算，SIMD，功耗低，通用计算能力弱，如果要发挥优势，就必须做定点优化，并利用SIMD。由于近年来大家都很卷，端上系统的功耗愈发敏感，许多原先由CPU进行的任务，都开始下放到DSP执行了。

### 1.2 DSP上必要的加速技术：

- SIMD：Single Instruction Multiple Data的缩写，它指的是一种并行计算的方式，即用一条指令同时对多个数据进行相同的操作。例如，一条SIMD指令可以同时对两个或多个向量中的每个元素进行加法或乘法。这样可以提高数据处理的吞吐量和效率，特别适合于数字信号处理中经常出现的向量运算。
- VLIW：Very Long Instruction Word的缩写，它指的是一种指令格式和架构，即用一个很长的指令字来包含多条子指令，每条子指令可以独立地在不同的功能单元上执行。例如，一个VLIW指令可以同时包含一个算术运算，一个逻辑运算，一个内存访问和一个分支跳转。这样可以提高指令级并行度和性能，特别适合于数字信号处理中经常出现的规则和可预测的控制流程。
- MAC：Multiply-Accumulate的缩写，它指的是一种运算操作，即将两个数相乘后再加上一个累加器的值。例如，一个MAC操作可以表示为C = A * B + C。这样可以减少运算步骤和误差，特别适合于数字信号处理中经常出现的卷积和滤波等操作。

### 1.3 高通提供的神经网络推理方案

- 骁龙专用的[SNPE](https://developer.qualcomm.com/sites/default/files/docs/snpe/overview.html)，模型格式是DLC。SNPE不能适用于车载芯片，参考 [高通论坛讨论](https://developer.qualcomm.com/forum/qdn-forums/software/qualcomm-neural-processing-sdk/70327)
- 通用的QNN(Qualcomm Neural Network)，常用在车载，移动，物联网等场景。支持CPU，GPU，HTP(Hexagon Tensor Processor)后端。

### 1.4 **HTP(Hexagon Tensor Processor)**

Soc上并不存在单独的cdsp，而是将cdsp和HTA(Hexagon Tensor Accelerator)集成起来构成了HTP。

### 1.5 高通Soc上可能的计算单元

- CPU, GPU, HTP三种相对通用的计算单元。
- adsp(Audio Digital Signal Processor，音频)
- ISP(Image Signal Processor，图像，包括拍摄、录制、图像处理，如HDR，美颜，人脸识别等)
- SLPI(Sensor Low Power Island，传感器数据，包括运动检测，姿态估计，手势识别等)
- Modem/MDSP(调制解调器，处理网络无线通信)

### 1.6.1 总线结构

Soc是多总线结构的，根据newBing对问题“在骁龙870上，CPU，GPU，adsp和cdsp是连接在同一条总线上的吗？请介绍一下这条总线的情况”的回答：

> 在骁龙870上，CPU，GPU，adsp和cdsp不是连接在同一条总线上的，它们是通过不同的接口和总线来进行通信和协作的。这些接口和总线的情况如下：  
> CPU和GPU之间通过一个叫做NoC（Network on Chip）的高速总线来进行通信和协作。NoC是一个分布式的网络结构，它可以实现多个处理器之间的高效数据传输和同步1。   
> CPU和adsp之间通过一个叫做ADSPSS（Audio DSP Subsystem）的接口来进行通信和协作。ADSPSS是一个专门用于音频处理的子系统，它包括一个音频编解码器，一个音频处理器，一个音频总线等2。   
> CPU和cdsp之间通过一个叫做Q6SS（Qualcomm Hexagon Subsystem）的接口来进行通信和协作。Q6SS是一个专门用于计算密集型任务的子系统，它包括一个标量单元，一个矢量单元，一个张量加速器等3。   
> GPU和adsp之间通过一个叫做ADSPSS-AXI（Audio DSP Subsystem Advanced eXtensible Interface）的总线来进行通信和协作。ADSPSS-AXI是一个基于AXI协议的总线，它可以实现GPU和adsp之间的高速数据传输。   
> GPU和cdsp之间通过一个叫做Q6SS-AXI（Qualcomm Hexagon Subsystem Advanced eXtensible Interface）的总线来进行通信和协作。Q6SS-AXI是一个基于AXI协议的总线，它可以实现GPU和cdsp之间的高速数据传输。

### 1.6.2 一致性保证
依然是newBing的回答，问题是“从内存和闪存中读取到的数据，是如何在多条总线间保持内容和时间一致性的呢？”

> 从内存和闪存中读取到的数据，在多条总线间保持内容和时间一致性的方法有以下几种：  
> 使用缓存一致性协议，如MESI（Modified, Exclusive, Shared, Invalid）或MOESI（Modified, Owned, Exclusive, Shared, Invalid），来保证不同处理器之间缓存中数据的一致性。   
> 使用内存屏障或内存栅栏指令，如DMB（Data Memory Barrier）或DSB（Data Synchronization Barrier），来保证不同处理器之间内存中数据的顺序性。   
> 使用原子操作指令，如LDREX（Load Exclusive）或STREX（Store Exclusive），来保证不同处理器之间内存中数据的原子性。

### 1.x 推荐阅读：

- [高通神经网络处理引擎SNPE分析与评测](http://yuenshome.space/timeline/2019-04/snpe/): 本文回顾了高通和骁龙处理器的发展历史，介绍了详尽的背景知识，包含系列Soc的架构和诸多参数，十分赞，看了看发现作者也是大佬，佩服。

## 2. 设备参数

|adsp指标|骁龙870|SA8295|
|--|--|--|
|Hexagon|||
|L1缓存|||
|L2缓存|||
|L3缓存|||
|DDR内存|||
|基础频率|||
|加速频率|||
|功耗|||
|线程数|||

## 3. Hexagon SDK获取

推荐使用tvm提供的 [非官方镜像](https://hub.docker.com/r/tlcpack/ci-hexagon/tags)，包含了sdk，Android ndk，tvm，llvm for hexagon等等依赖。

```
docker pull tlcpack/ci-hexagon:20230504-142417-4d37a0a0
```

所需的工具链都在/opt下，包含了Android-sdk, clang-llvm, 和qualcomm/hexagon_sdk。  
接下来，我们利用这些工具链，在骁龙870的adsp芯片上打印"Hello World"

## 4. adsp上的Hello World

## 5. HVX指令集调用

## 6. tvm for hexagon-adsp