# pybind11 기본 모듈 템플릿

## 파일 구조

```
my_module/
├── CMakeLists.txt
├── setup.py
├── pyproject.toml
├── src/
│   ├── main.cpp          # 바인딩 정의
│   └── core.cpp          # C++ 구현
├── include/
│   └── core.hpp          # 헤더
├── tests/
│   └── test_module.py
└── README.md
```

---

## main.cpp (바인딩 정의)

```cpp
#include <pybind11/pybind11.h>
#include "core.hpp"

namespace py = pybind11;

PYBIND11_MODULE(my_module, m) {
    m.doc() = R"pbdoc(
        My Module - Python bindings for C++ code
        -----------------------------------------

        .. currentmodule:: my_module

        .. autosummary::
           :toctree: _generate

           add
           subtract
           multiply
    )pbdoc";

    // 함수 바인딩
    m.def("add", &add, R"pbdoc(
        Add two numbers.

        Args:
            a: First number
            b: Second number

        Returns:
            Sum of a and b
    )pbdoc",
        py::arg("a"), py::arg("b"));

    m.def("subtract", &subtract,
        py::arg("a"), py::arg("b"));

    m.def("multiply", &multiply,
        py::arg("a"), py::arg("b"));

    // 버전 정보
    #ifdef VERSION_INFO
        m.attr("__version__") = MACRO_STRINGIFY(VERSION_INFO);
    #else
        m.attr("__version__") = "dev";
    #endif
}
```

---

## core.hpp (헤더)

```cpp
#ifndef CORE_HPP
#define CORE_HPP

int add(int a, int b);
int subtract(int a, int b);
int multiply(int a, int b);

#endif // CORE_HPP
```

---

## core.cpp (구현)

```cpp
#include "core.hpp"

int add(int a, int b) {
    return a + b;
}

int subtract(int a, int b) {
    return a - b;
}

int multiply(int a, int b) {
    return a * b;
}
```

---

## setup.py

```python
from setuptools import setup, find_packages
from pybind11.setup_helpers import Pybind11Extension, build_ext

__version__ = "0.1.0"

ext_modules = [
    Pybind11Extension(
        "my_module",
        ["src/main.cpp", "src/core.cpp"],
        include_dirs=["include"],
        define_macros=[('VERSION_INFO', __version__)],
        cxx_std=17,
    ),
]

setup(
    name="my_module",
    version=__version__,
    author="Your Name",
    author_email="your.email@example.com",
    description="Python bindings for C++ code",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    ext_modules=ext_modules,
    cmdclass={"build_ext": build_ext},
    zip_safe=False,
    python_requires=">=3.7",
)
```

---

## pyproject.toml

```toml
[build-system]
requires = ["setuptools>=42", "pybind11>=2.10.0"]
build-backend = "setuptools.build_meta"

[project]
name = "my_module"
version = "0.1.0"
description = "Python bindings for C++ code"
readme = "README.md"
requires-python = ">=3.7"
license = {text = "MIT"}

[project.optional-dependencies]
test = ["pytest"]
```

---

## 빌드 명령어

```bash
# 개발 모드 설치
pip install -e .

# wheel 빌드
pip wheel . -w dist/

# 테스트
pytest tests/
```

---

## test_module.py

```python
import pytest
import my_module

def test_add():
    assert my_module.add(1, 2) == 3
    assert my_module.add(-1, 1) == 0
    assert my_module.add(0, 0) == 0

def test_subtract():
    assert my_module.subtract(5, 3) == 2
    assert my_module.subtract(3, 5) == -2

def test_multiply():
    assert my_module.multiply(3, 4) == 12
    assert my_module.multiply(-2, 3) == -6

def test_version():
    assert hasattr(my_module, '__version__')
```
