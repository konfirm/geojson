# Changelog

## [2.0.1-beta.0](https://github.com/konfirm/geojson/compare/v2.0.0...v2.0.1-beta.0) (2026-09-08)

### Bug Fixes

* antimeridian-crossing geometry before flat-plane math ([4623cf2](https://github.com/konfirm/geojson/commit/4623cf210e60f71b33ffb49dd8dcca9bbe23302f)), closes [#12](https://github.com/konfirm/geojson/issues/12)
* **ci:** stop coverage scripts from sweeping up the GeodTest.dat stream test ([156dcf6](https://github.com/konfirm/geojson/commit/156dcf640741d96016f3e48d5e6b52535812f5d6))
* put text together ([727d850](https://github.com/konfirm/geojson/commit/727d85073de4ea6193058a02f34a364168da3749))

## [2.0.0](https://github.com/konfirm/geojson/compare/v2.0.0-beta.0...v2.0.0) (2026-06-08)

## [2.0.0-beta.0](https://github.com/konfirm/geojson/compare/v1.0.1...v2.0.0-beta.0) (2026-06-07)

### ⚠ BREAKING CHANGES

* geometrycollection is a geometry
* throw EvalError when Vincenty fails to converge for near-antipodal points
* correct winding semantics and enforce RFC 7946 §3.1.6 in isStrictPolygon

### Features

* add comparison table generator ([5b9650a](https://github.com/konfirm/geojson/commit/5b9650a6b62f026c966fb528939fdb98ef0edc9f))
* add generic (geometry | null) support to feature, featurecollection and geometrycollection ([94f4687](https://github.com/konfirm/geojson/commit/94f46873ada35a76207da90d253114553e891bf6))
* add GeometryPrimitive type (and guards) and RFC-aligned Position ([0a32344](https://github.com/konfirm/geojson/commit/0a32344e120df1259dbb4a06607b88c691f86099))
* **distance:** add 'karney' as a fourth PointToPointCalculation formula ([b199dab](https://github.com/konfirm/geojson/commit/b199dab8695e89645b0c28b9ee1d712d2c6ec59e))
* provide the distance algorithms as exported functions ([08fcc40](https://github.com/konfirm/geojson/commit/08fcc40230d2841dbfdeaaab8fe29cd7521e5ed6))

### Bug Fixes

* correct winding semantics and enforce RFC 7946 §3.1.6 in isStrictPolygon ([630f23e](https://github.com/konfirm/geojson/commit/630f23e13ec725ce2df0219d751529262ebbca4c))
* found an infinite loop if we don't break off the recursion ([70acfb2](https://github.com/konfirm/geojson/commit/70acfb2a226ff3cf71d6a33c5e20c4d356365c5c))
* geometrycollection is a geometry ([f8d3463](https://github.com/konfirm/geojson/commit/f8d3463d727d9698b9a4309f1f567f5ab01eb56d))
* skip null geometries in feature(collection)s ([414dd61](https://github.com/konfirm/geojson/commit/414dd61888d9f7b326a4ed17f72f8c99f06bf7f2))
* throw EvalError when Vincenty fails to converge for near-antipodal points ([9f36c63](https://github.com/konfirm/geojson/commit/9f36c633bb56a9b321ad9428df392406f461654e))
* use Position instead of [number, number] ([1081be2](https://github.com/konfirm/geojson/commit/1081be2cac6865c20b755b5db7512f4261e3948e))

### Performance Improvements

* if the algorithm starts fixating to the same value throw early, it won't recover ([0cd28e0](https://github.com/konfirm/geojson/commit/0cd28e0e5cc5eaebab17ef8b63edf7532758c48b))

## [1.0.1](https://github.com/konfirm/geojson/compare/v1.0.1-beta.0...v1.0.1) (2026-05-30)

## [1.0.1-beta.0](https://github.com/konfirm/geojson/compare/v1.0.0...v1.0.1-beta.0) (2026-05-30)

### Performance Improvements

* add a quick 'within box' check before the more expensive math ([e54d7c0](https://github.com/konfirm/geojson/commit/e54d7c0b36a4096c63c4d887f1d8a49bd25f15ff))

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] -

### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security

## [1.0.0] - 2023-02-05

_Initial release_

[unreleased]: https://github.com/konfirm/geojson/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/konfirm/geojson/releases/tag/v1.0.0
