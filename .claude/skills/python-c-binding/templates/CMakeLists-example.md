# CMake 빌드 템플릿

## 기본 CMakeLists.txt

```cmake
cmake_minimum_required(VERSION 3.15)
project(my_module VERSION 0.1.0 LANGUAGES CXX)

# C++ 표준 설정
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# pybind11 찾기
find_package(pybind11 REQUIRED)

# Python 모듈 생성
pybind11_add_module(my_module
    src/main.cpp
    src/core.cpp
)

# 헤더 디렉토리 추가
target_include_directories(my_module PRIVATE include)

# 버전 매크로 정의
target_compile_definitions(my_module PRIVATE
    VERSION_INFO="${PROJECT_VERSION}"
)

# 최적화 플래그 (Release 빌드)
if(CMAKE_BUILD_TYPE STREQUAL "Release")
    target_compile_options(my_module PRIVATE -O3 -march=native)
endif()

# 설치 규칙
install(TARGETS my_module
    LIBRARY DESTINATION ${Python_SITEARCH}
)
```

---

## 외부 라이브러리 연동

### Eigen (행렬 연산)

```cmake
find_package(Eigen3 REQUIRED)

pybind11_add_module(my_module src/main.cpp)
target_link_libraries(my_module PRIVATE Eigen3::Eigen)
```

### OpenMP (병렬 처리)

```cmake
find_package(OpenMP)

pybind11_add_module(my_module src/main.cpp)

if(OpenMP_CXX_FOUND)
    target_link_libraries(my_module PRIVATE OpenMP::OpenMP_CXX)
endif()
```

### CUDA

```cmake
enable_language(CUDA)
find_package(CUDAToolkit REQUIRED)

pybind11_add_module(my_module
    src/main.cpp
    src/kernel.cu
)

target_link_libraries(my_module PRIVATE CUDA::cudart)
```

---

## scikit-build-core (권장 방식)

### pyproject.toml

```toml
[build-system]
requires = ["scikit-build-core", "pybind11"]
build-backend = "scikit_build_core.build"

[project]
name = "my_module"
version = "0.1.0"
requires-python = ">=3.8"

[tool.scikit-build]
cmake.minimum-version = "3.15"
cmake.build-type = "Release"
wheel.packages = ["src/my_module"]
```

### 빌드 명령어

```bash
# 개발 모드
pip install -e . --no-build-isolation

# wheel 생성
pip wheel . -w dist/

# 상세 로그
pip install . -v
```

---

## 다중 플랫폼 지원

```cmake
# 플랫폼별 설정
if(WIN32)
    target_compile_definitions(my_module PRIVATE _WIN32_WINNT=0x0601)
elseif(APPLE)
    target_compile_options(my_module PRIVATE -stdlib=libc++)
else()
    # Linux
    target_compile_options(my_module PRIVATE -fvisibility=hidden)
endif()

# 아키텍처별 설정
if(CMAKE_SYSTEM_PROCESSOR MATCHES "arm|aarch64")
    target_compile_options(my_module PRIVATE -mfpu=neon)
endif()
```

---

## 테스트 추가

```cmake
enable_testing()

# pytest 실행
add_test(NAME pytest
    COMMAND ${Python_EXECUTABLE} -m pytest ${CMAKE_SOURCE_DIR}/tests
    WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
)

# C++ 단위 테스트 (Google Test)
find_package(GTest REQUIRED)

add_executable(cpp_tests tests/cpp_tests.cpp)
target_link_libraries(cpp_tests PRIVATE GTest::gtest_main my_module_lib)

include(GoogleTest)
gtest_discover_tests(cpp_tests)
```

---

## 빌드 스크립트

### build.sh (Linux/macOS)

```bash
#!/bin/bash
set -e

mkdir -p build
cd build

cmake .. \
    -DCMAKE_BUILD_TYPE=Release \
    -DPYTHON_EXECUTABLE=$(which python)

cmake --build . -j$(nproc)

# 테스트
ctest --output-on-failure
```

### build.ps1 (Windows)

```powershell
# PowerShell 빌드 스크립트
$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path build | Out-Null
Set-Location build

cmake .. `
    -G "Visual Studio 17 2022" `
    -A x64 `
    -DCMAKE_BUILD_TYPE=Release

cmake --build . --config Release

# 테스트
ctest -C Release --output-on-failure
```

---

## 디버그 빌드

```cmake
# Debug 모드 설정
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    target_compile_definitions(my_module PRIVATE DEBUG_MODE)
    target_compile_options(my_module PRIVATE -g -O0 -fsanitize=address)
    target_link_options(my_module PRIVATE -fsanitize=address)
endif()
```

```bash
# 디버그 빌드
cmake -DCMAKE_BUILD_TYPE=Debug ..
make
```
