using AutoMapper;
using Project1.Entities;
using Project1.Models.DTOs;

namespace Project1.Mapping
{
    public class ProductImageMappingProfile : Profile
    {
        public ProductImageMappingProfile()
        {
            CreateMap<ProductImage, ProductImageDto>();
        }
    }
}
