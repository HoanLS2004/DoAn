using AutoMapper;
using Project1.Entities;
using Project1.Models.DTOs;
using Project1.Models.Entities;

namespace Project1.Mapping
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Brand
            CreateMap<Brand, BrandDto>();
            CreateMap<BrandCreateDto, Brand>();
            CreateMap<BrandUpdateDto, Brand>();

            // ✅ PRODUCT (QUAN TRỌNG NHẤT)
            CreateMap<Product, ProductDto>()
                // lấy tên brand
                .ForMember(dest => dest.BrandName,
                    opt => opt.MapFrom(src => src.Brand.Name))

                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.Name))
                .ForMember(dest => dest.ThumbnailUrl,
                    opt => opt.MapFrom(src =>
                        src.Images
                            .Where(i => i.IsThumbnail)
                            .Select(i => i.ImageUrl)
                            .FirstOrDefault()
                    ));

            // Create / Update
            CreateMap<ProductCreateDto, Product>();
            CreateMap<ProductUpdateDto, Product>();
            CreateMap<Category, CategoryDTO>();
            CreateMap<CategoryCreateDto, Category>();
            CreateMap<CategoryUpdateDto, Category>();
        }
    }
}